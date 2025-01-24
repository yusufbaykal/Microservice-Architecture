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
  }) {
    try {
      await this.channel.publish(
        this.config.exchanges.product,
        this.config.routingKeys.productCheck,
        Buffer.from(JSON.stringify(productData)),
        { 
          persistent: true,
          headers: { 'retry-count': 0 },
          correlationId: productData.correlationId
        }
      );
    } catch (error) {
      console.error('Ürün kontrol isteği gönderilemedi:', error);
      throw error;
    }
  }
}

