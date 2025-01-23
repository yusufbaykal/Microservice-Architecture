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
        await this.eventConsumer.initialize();
    }

    async start(orderRequest: OrderCreateRequest): Promise<IOrder> {
        const correlationId = uuidv4();

        return new Promise<IOrder>((resolve, reject) => {
            this.pendingSagas.set(correlationId, { resolve, reject });

            const timeout = setTimeout(
                () => this.handleTimeout(correlationId),
                RabbitMQConfig.retryPolicy.maxRetries * RabbitMQConfig.retryPolicy.retryDelay
            );

            this.eventConsumer.registerCallback(correlationId, async (result) => {
                try {
                    clearTimeout(timeout);
                    await this.processResult(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.pendingSagas.delete(correlationId);
                }
            });

            this.eventProducer.sendProductCheckRequest({
                ...orderRequest,
                correlationId
            }).catch(reject);
        });
    }

    private async createOrder(result: ProductCheckResult): Promise<IOrder> {
        return await this.orderRepository.create({
            product_id: result.order_id,
            quantity: result.quantity,
            total: result.total,
            status: OrderStatus.PENDING
        });
    }

    private async processResult(result: ProductCheckResult): Promise<void> {
        const saga = this.pendingSagas.get(result.correlationId);
        if (!saga) return;

        try {
            if (result.status === 'success') {
                const order = await this.createOrder(result);
                await this.eventProducer.sendNotification(order);
                saga.resolve(order);
            } else {
                saga.reject(new Error(result.error || 'Ürün kontrolü başarısız'));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            saga.reject(new Error(errorMessage));
        }
    }

    private handleTimeout(correlationId: string): void {
        const saga = this.pendingSagas.get(correlationId);
        if (saga) {
            saga.reject(new Error('İşlem zaman aşımına uğradı'));
            this.pendingSagas.delete(correlationId);
            this.eventConsumer.unregisterCallback(correlationId);
        }
    }
}