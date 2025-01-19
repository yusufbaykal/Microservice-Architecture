import { OrderRepository } from '../../domain/Repositories/Repositories';
import { IOrder, OrderStatus} from '../../domain/Models/Models';
import { OrderEventProducer } from '../event/Producer';

export interface OrderCreateMessage {
    product_id: string;
    quantity: number;
    total: number;
    status: OrderStatus;
}

export class OrderSaga {
    static orderRepository: OrderRepository;

    static initialize(repository: OrderRepository) {
        OrderSaga.orderRepository = repository;
    }

    static async start(orderData: { product_id: string; quantity: number; total: number }) {
        let order: IOrder | null = null;
        try {
            const orderCreateRequest = {
                product_id: orderData.product_id,
                quantity: orderData.quantity,
                total: orderData.total,
                status: OrderStatus.PENDING
            };

            order = await OrderSaga.orderRepository.create(orderCreateRequest);
            console.log('Sipariş başarıyla oluşturuldu:', order);

            await OrderEventProducer.sendOrderForProductCheck(order);

            return new Promise((resolve, reject) => {
                /*
                OrderEvent.onProductCheckResult(async (result: { orderId: string, status: OrderStatus, message: string }) => {
                    if (orderDocument && result.orderId === orderDocument._id.toString()) {
                        if (result.status === OrderStatus.CANCELLED) {
                            await OrderSaga.failOrder(orderDocument._id.toString(), result.message);
                            reject(new Error(result.message));
                        } else if (result.status === OrderStatus.COMPLETED) {
                            await OrderSaga.completeOrder(orderDocument._id.toString());
                            resolve(await OrderSaga.getOrder(orderDocument._id.toString()));
                        }
                    }
                });
                */

                const timeout = setTimeout(async () => {
                    if (order) {
                        if (order._id) {
                            await OrderSaga.failOrder(order._id.toString());
                        }
                        reject(new Error('Ürün kontrolü zaman aşımına uğradı'));
                    }
                }, 10000);

                process.on('SIGTERM', () => {
                    clearTimeout(timeout);
                });
            });

        } catch (error) {
            if (order) {
                await OrderSaga.failOrder(order._id!.toString());
            }
            throw error;
        }
    }

    static async getOrder(order_id: string) {
        return await OrderSaga.orderRepository.findById(order_id);
    }

    static async completeOrder(order_id: string) {
        return await OrderSaga.orderRepository.updateStatus(order_id, OrderStatus.COMPLETED);
    }

    static async failOrder(order_id: string) {
        return await OrderSaga.orderRepository.updateStatus(order_id, OrderStatus.CANCELLED);
    }
}