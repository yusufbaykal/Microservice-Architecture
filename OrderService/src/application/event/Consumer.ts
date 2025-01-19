import { Channel, ConsumeMessage } from 'amqplib';
import { OrderSaga } from '../saga/Saga';
import { OrderEventProducer } from './Producer';

export class OrderEventConsumer {
    private static channel: Channel;

    static async initialize(channel: Channel): Promise<void> {
        OrderEventConsumer.channel = channel;
        await OrderEventConsumer.setupExchangesAndQueues();
        await OrderEventConsumer.listenEvents();
    }

    private static async setupExchangesAndQueues(): Promise<void> {
        try {
            await OrderEventConsumer.channel.assertExchange('product-exchange', 'topic', { durable: true });

            await OrderEventConsumer.channel.assertQueue('product-response-queue', { durable: true });

            await OrderEventConsumer.channel.bindQueue('product-response-queue', 'product-exchange', 'product.checked');
            await OrderEventConsumer.channel.bindQueue('product-response-queue', 'product-exchange', 'stock.updated');

            console.log('Order service queues and exchanges setup completed');
        } catch (error) {
            console.error('RabbitMQ setup error:', error);
            throw error;
        }
    }

    private static async listenEvents(): Promise<void> {
        try {
            console.log('Setting up order event listeners...');
            await OrderEventConsumer.channel.consume('product-response-queue', async (message: ConsumeMessage | null) => {
                if (message) {
                    try {
                        const { order_id, status, error } = JSON.parse(message.content.toString());
                        console.log(`Received product response for order ${order_id}, status: ${status}, routing key: ${message.fields.routingKey}`);

                        if (status === 'success') {
                            if (message.fields.routingKey === 'product.checked') {
                                console.log(`Product check successful for order: ${order_id}, requesting stock update`);
                                const order = await OrderSaga.getOrder(order_id);
                                if (order) {
                                    await OrderEventProducer.sendOrderForStockUpdate(order); 
                                }
                            } else if (message.fields.routingKey === 'stock.updated') {
                                console.log(`Stock update successful for order: ${order_id}, completing order`); 
                                await OrderSaga.completeOrder(order_id);
                                await OrderEventProducer.publishOrderCompleted(order_id); 
                            }
                        } else {
                            console.log(`Operation failed for order: ${order_id}, error: ${error}`);
                            await OrderSaga.failOrder(order_id); 
                        }

                        OrderEventConsumer.channel.ack(message);
                    } catch (error: unknown) {
                        console.error('Product response handling error:', error);
                        OrderEventConsumer.channel.ack(message);
                    }
                }
            });
        } catch (error) {
            console.error('Error setting up event listeners:', error);
            throw error;
        }
    }
}