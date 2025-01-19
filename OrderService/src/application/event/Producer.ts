import { Channel} from 'amqplib';
import { IOrder, } from '../../domain/Models/Models';

export class OrderEventProducer {
    private static channel: Channel;

    static async initialize(channel: Channel): Promise<void> {
        OrderEventProducer.channel = channel;
        await OrderEventProducer.setupExchangesAndQueues();

    }

    private static async setupExchangesAndQueues(): Promise<void> {
        try {

            await OrderEventProducer.channel.assertExchange('order-exchange', 'topic', { durable: true });
            await OrderEventProducer.channel.assertExchange('product-exchange', 'topic', { durable: true });


            await OrderEventProducer.channel.assertQueue('product-response-queue', { durable: true });
            await OrderEventProducer.channel.assertQueue('order-completed-queue', { durable: true });

            await OrderEventProducer.channel.bindQueue('product-response-queue', 'product-exchange', 'product.checked');
            await OrderEventProducer.channel.bindQueue('product-response-queue', 'product-exchange', 'stock.updated');
            await OrderEventProducer.channel.bindQueue('order-completed-queue', 'order-exchange', 'order.completed');

            console.log('Order service queues and exchanges setup completed');
        } catch (error) {
            console.error('RabbitMQ setup error:', error);
            throw error;
        }
    }
    
    static async sendOrderForProductCheck(order: IOrder): Promise<void> {
        try {
            await OrderEventProducer.channel.publish('product-exchange', 'product.checked', Buffer.from(JSON.stringify({
                order_id: order._id,
                product_id: order.product_id,
                quantity: order.quantity
            })));
        } catch (error) {
            console.error('Error sending product check request:', error);
            throw error;
        }
    }

    static async sendOrderForStockUpdate(order: IOrder): Promise<void> {
        try {
            await OrderEventProducer.channel.publish('product-exchange', 'stock.updated', Buffer.from(JSON.stringify({
                order_id: order._id,
                product_id: order.product_id,
                quantity: order.quantity
            })));
        } catch (error) {
            console.error('Error sending stock update request:', error);
            throw error;
        }
    }

    static async publishOrderCompleted(order_id: string): Promise<void> {
        try {
            await OrderEventProducer.channel.publish('order-exchange', 'order.completed', Buffer.from(JSON.stringify({
                order_id,
                status: 'success'
            })));
        } catch (error) {
            console.error('Error publishing order completed:', error);
            throw error;
        }
    }
}