import { Channel } from 'amqplib';

export const RabbitMQConfig = {
    exchanges: {
        notification: 'notification-exchange',
        dlx: 'notification-dlx-exchange'
    },
    queues: {
        notification: 'notification-processing-queue',
        dlq: 'notification-dead-letter-queue'
    },
    routingKeys: {
        orderNotification: 'order.notification',
        dlq: 'notification.dead-letter'
    },
    retryPolicy: {
        maxRetries: 3,
        retryDelay: 5000
    }
};

export const initializeRabbitMQ = async (channel: Channel) => {
    try {

        await channel.assertExchange(RabbitMQConfig.exchanges.notification, 'topic', { 
            durable: true 
        });
        await channel.assertExchange(RabbitMQConfig.exchanges.dlx, 'topic', { 
            durable: true 
        });

        await channel.assertQueue(RabbitMQConfig.queues.notification, {
            durable: true,
            deadLetterExchange: RabbitMQConfig.exchanges.dlx,
            deadLetterRoutingKey: RabbitMQConfig.routingKeys.dlq,
            messageTtl: RabbitMQConfig.retryPolicy.retryDelay
        });

        await channel.assertQueue(RabbitMQConfig.queues.dlq, { 
            durable: true 
        });

        await channel.bindQueue(
            RabbitMQConfig.queues.notification,
            RabbitMQConfig.exchanges.notification,
            RabbitMQConfig.routingKeys.orderNotification
        );

        await channel.bindQueue(
            RabbitMQConfig.queues.dlq,
            RabbitMQConfig.exchanges.dlx,
            RabbitMQConfig.routingKeys.dlq
        );

        console.log('Notification service RabbitMQ setup completed');
    } catch (error) {
        console.error('RabbitMQ setup error:', error);
        throw error;
    }
};