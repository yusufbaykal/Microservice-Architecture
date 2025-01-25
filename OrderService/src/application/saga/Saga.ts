import { v4 as uuidv4 } from 'uuid';
import { OrderRepository } from '../../domain/Repositories/Repositories';
import { RabbitMQConfig } from '../../config/rabbitmq.config';
import { ProductCheckResult, OrderCreateRequest, IEventConsumer, IEventProducer, IOrder, OrderStatus } from '../../types/index.ds';

interface SagaCallbacks {
    resolve: (value: IOrder | PromiseLike<IOrder>) => void;
    reject: (reason?: Error) => void;
}

export class OrderSaga {
    private pendingSagas = new Map<string, SagaCallbacks>();

    constructor(
        private orderRepository: OrderRepository,
        private eventProducer: IEventProducer,
        private eventConsumer: IEventConsumer
    ) {
        this.initializeConsumer();
    }

    private async initializeConsumer(): Promise<void> {
        console.log('Initializing OrderSaga consumer...');
        await this.eventConsumer.initialize();
    }

    async start(orderRequest: OrderCreateRequest): Promise<IOrder> {
        const correlationId = uuidv4();
        console.log('Starting new order saga with correlationId:', correlationId);

        return new Promise<IOrder>((resolve, reject) => {
            this.pendingSagas.set(correlationId, { resolve, reject });

            const timeout = setTimeout(
                () => this.handleTimeout(correlationId),
                RabbitMQConfig.retryPolicy.maxRetries * RabbitMQConfig.retryPolicy.retryDelay
            );

            this.eventConsumer.registerCallback(correlationId, async (result: ProductCheckResult) => {
                try {
                    console.log('Received product check result:', result);
                    clearTimeout(timeout);
                    await this.processResult(result, correlationId);
                } catch (error) {
                    console.error('Error processing result:', error);
                    reject(error);
                } finally {
                    this.pendingSagas.delete(correlationId);
                    this.eventConsumer.unregisterCallback(correlationId);
                }
            });

            this.eventProducer.sendProductCheckRequest({
                product_id: orderRequest.product_id,
                quantity: orderRequest.quantity,
                correlationId
            }).catch(error => {
                console.error('Failed to send product check request:', error);
                clearTimeout(timeout);
                this.pendingSagas.delete(correlationId);
                this.eventConsumer.unregisterCallback(correlationId);
                reject(error);
            });
        });
    }

    private async createOrder(result: ProductCheckResult): Promise<IOrder> {
        console.log('Creating order with result:', result);
        return await this.orderRepository.create({
            product_id: result.product_id,
            quantity: result.quantity,
            total: result.total,
            status: OrderStatus.PENDING
        });
    }

    private async processResult(result: ProductCheckResult, correlationId: string): Promise<void> {
        console.log('Processing result for correlationId:', correlationId);
        const saga = this.pendingSagas.get(correlationId);
        if (!saga) {
            console.warn('No pending saga found for correlationId:', correlationId);
            return;
        }

        try {
            if (result.status === 'success') {
                console.log('Product check successful, creating order...');
                const order = await this.createOrder(result);
                console.log('Order created successfully:', order);
                await this.eventProducer.sendNotification(order);
                saga.resolve(order);
            } else {
                console.error('Product check failed:', result.error);
                saga.reject(new Error(result.error || 'Failed product check'));
            }
        } catch (error) {
            console.error('Error in processResult:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            saga.reject(new Error(errorMessage));
        }
    }

    private handleTimeout(correlationId: string): void {
        console.log('Handling timeout for correlationId:', correlationId);
        const saga = this.pendingSagas.get(correlationId);
        if (saga) {
            saga.reject(new Error('Transaction timed out'));
            this.pendingSagas.delete(correlationId);
            this.eventConsumer.unregisterCallback(correlationId);
        }
    }
}