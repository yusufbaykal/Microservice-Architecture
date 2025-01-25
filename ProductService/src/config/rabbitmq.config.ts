import { Channel } from 'amqplib';

export const RabbitMQConfig = {
  exchanges: {
    product: 'product-exchange',
    order: 'order-exchange',
    dlx: 'dlx-exchange'
  },
  queues: {
    orderResponse: 'order-response-queue', 
    productCheck: 'product-check-queue',
    dlq: 'dead-letter-queue'
  },
  routingKeys: {
    productCheck: 'order.product.check',
    productCheckResult: 'product.check.result'
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
    await channel.assertExchange(RabbitMQConfig.exchanges.dlx, 'topic', { durable: true });

    await channel.assertQueue(RabbitMQConfig.queues.productCheck, {
      durable: true,
      deadLetterExchange: RabbitMQConfig.exchanges.dlx,
      messageTtl: RabbitMQConfig.retryPolicy.retryDelay
    });

    
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