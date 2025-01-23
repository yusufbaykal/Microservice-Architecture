import { Channel } from 'amqplib';
import { IEventProducer, IOrder } from '../../types/index.ds';
import { RabbitMQConfig } from '../../config/rabbitmq.config';


export class OrderEventProducer implements IEventProducer {
  constructor(
    private channel: Channel, 
    private config: typeof RabbitMQConfig = RabbitMQConfig 
  ) {}

  async sendProductCheckRequest(orderData: { 
    product_id: string; 
    quantity: number;
    correlationId: string;
  }) {
    try {
      await this.channel.publish(
        this.config.exchanges.product,
        this.config.routingKeys.productCheck,
        Buffer.from(JSON.stringify(orderData)),
        { 
          persistent: true,
          headers: { 'retry-count': 0 },
          correlationId: orderData.correlationId
        }
      );
    } catch (error) {
      console.error('Ürün kontrol isteği gönderilemedi:', error);
      throw error;
    }
  }

  async sendNotification(order: IOrder) {
    try {
      await this.channel.publish(
        this.config.exchanges.notification,
        this.config.routingKeys.notification,
        Buffer.from(JSON.stringify({
          order_id: order._id,
          message: 'Yeni sipariş oluşturuldu'
        })),
        { persistent: true }
      );
    } catch (error) {
      console.error('Bildirim gönderilemedi:', error);
      throw error;
    }
  }
}