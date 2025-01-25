import { Channel, ConsumeMessage } from 'amqplib';
import { RabbitMQConfig } from '../../config/rabbitmq.config';
import { INotificationConsumer, NotificationMessage } from '../../types/index.ds';
import { NotificationModel } from '../../domain/models/Models';

export class NotificationEventConsumer implements INotificationConsumer {
    constructor(
        private channel: Channel,
        private config: typeof RabbitMQConfig
    ) {}

    async initialize(): Promise<void> {
        try {
            await this.channel.consume(
                this.config.queues.notification,
                this.processMessage.bind(this)
            );
            console.log('Notification consumer initialized');
        } catch (error) {
            console.error('Notification consumer initialization error:', error);
            throw error;
        }
    }

    private async processMessage(msg: ConsumeMessage | null): Promise<void> {
        if (!msg) return;

        try {
            const message = JSON.parse(msg.content.toString()) as NotificationMessage;
            const headers = msg.properties.headers as { 'retry-count'?: number };
            const retryCount = headers?.['retry-count'] || 0;

            if (retryCount >= this.config.retryPolicy.maxRetries) {
                console.error('Maximum retry count reached for notification:', message.order_id);
                this.channel.nack(msg, false, false);
                return;
            }

            await this.handleMessage(message);
            this.channel.ack(msg);

        } catch (error) {
            console.error('Error processing notification:', error);
            
            const headers = msg.properties.headers || {};
            const retryCount = (headers['retry-count'] || 0) + 1;
            
            this.channel.nack(msg, false, true);
        }
    }

    async handleMessage(message: NotificationMessage): Promise<void> {
        try {
            await NotificationModel.create({
                order_id: message.order_id,
                message: message.message,
                createdAt: new Date()
            });

            console.log('Notification created for order:', message.order_id);
        } catch (error) {
            console.error('Error handling notification:', error);
            throw error;
        }
    }
}