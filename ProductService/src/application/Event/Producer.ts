import { Channel } from 'amqplib';
import { IEventProducer, IProduct } from '../../types/index.ds';
import { RabbitMQConfig } from '../../config/rabbitmq.config';

export class ProductEventProducer implements IEventProducer {

  constructor(
    private channel: Channel, 
    private config: typeof RabbitMQConfig = RabbitMQConfig 
  ) {}

  async sendProductCheckResponse(productData: {
    product_id: string; 
    quantity: number;
    correlationId: string;
    status: string;
    error?: string;
    total: number;
  }) {
    try {
      console.log('Sending product check response:', productData);
      
      const quantity = typeof productData.quantity === 'string' ? parseInt(productData.quantity) : productData.quantity;
      
      await this.channel.publish(
        this.config.exchanges.order,
        this.config.routingKeys.productCheckResult,
        Buffer.from(JSON.stringify({
          ...productData,
          quantity: quantity,
          total: productData.total
        })),
        { 
          persistent: true,
          headers: { 'retry-count': 0 },
          correlationId: productData.correlationId
        }
      );

      console.log('Product check response sent successfully');
    } catch (error) {
      console.error('Failed to send product check response:', error);
      throw error;
    }
  }
}

