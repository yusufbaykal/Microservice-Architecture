import { Channel } from 'amqplib';

export const RabbitMQConfig = {
    exchanges: {
      order: 'order-exchange',
      product: 'product-exchange',
      notification: 'notification-exchange',
      dlx: 'dlx-exchange'
    },
    queues: {
      productCheck: 'product-check-queue',
      notification: 'notification-queue',
      orderResponse: 'order-response-queue',
      dlq: 'dead-letter-queue'
    },
    routingKeys: {
      productCheck: 'order.product.check',
      productCheckResult: 'product.check.result',
      notification: 'order.notification',
      orderResponse: 'order.response'
    },
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 5000
    }
  };
  
  export const initializeRabbitMQ = async (channel: Channel) => {
    try {
      await channel.assertExchange(RabbitMQConfig.exchanges.order, 'topic', { durable: true });
      await channel.assertExchange(RabbitMQConfig.exchanges.product, 'topic', { durable: true });
      await channel.assertExchange(RabbitMQConfig.exchanges.notification, 'topic', { durable: true });
      await channel.assertExchange(RabbitMQConfig.exchanges.dlx, 'topic', { durable: true });
  
      await channel.assertQueue(RabbitMQConfig.queues.productCheck, {
        durable: true,
        deadLetterExchange: RabbitMQConfig.exchanges.dlx,
        messageTtl: RabbitMQConfig.retryPolicy.retryDelay
      });
  
      await channel.assertQueue(RabbitMQConfig.queues.notification, { durable: true });
      
      await channel.assertQueue(RabbitMQConfig.queues.orderResponse, {
        durable: true,
        deadLetterExchange: RabbitMQConfig.exchanges.dlx
      });
  
      await channel.assertQueue(RabbitMQConfig.queues.dlq, { durable: true });
      
      await channel.bindQueue(
        RabbitMQConfig.queues.productCheck,
        RabbitMQConfig.exchanges.product,
        RabbitMQConfig.routingKeys.productCheck
      );
  
      await channel.bindQueue(
        RabbitMQConfig.queues.orderResponse,
        RabbitMQConfig.exchanges.product,
        RabbitMQConfig.routingKeys.productCheckResult
      );
  
      await channel.bindQueue(
        RabbitMQConfig.queues.dlq,
        RabbitMQConfig.exchanges.dlx,
        '#'
      );
  
      console.log('RabbitMQ setup completed');
    } catch (error) {
      console.error('RabbitMQ setup error:', error);
      throw error;
    }
  };