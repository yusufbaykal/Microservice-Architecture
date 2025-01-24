import { Channel, ConsumeMessage } from 'amqplib';
import { RabbitMQConfig } from '../../config/rabbitmq.config';
import { IEventConsumer,ProductCheckResult } from '../../types/index.ds';
import { RabbitMQ } from '../../config/rabbitmq';
export interface MessageHeaders {
    'retry-count': number;
}

export class OrderEventConsumer implements IEventConsumer {
    private callbacks = new Map<string, (result: ProductCheckResult) => Promise<void>>();
  
    constructor(
      private channel: Channel,
      private config: typeof RabbitMQConfig = RabbitMQConfig,
      public rabbitMQ: RabbitMQ
    ) {}
  
    async initialize(): Promise<void> {
      await this.channel.consume(
        this.config.queues.orderResponse,
        this.handleMessage.bind(this)
      );
    }
  
    private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
      if (!msg) return;
  
      try {
        const result = JSON.parse(msg.content.toString()) as ProductCheckResult;
        const headers = msg.properties.headers as { 'retry-count'?: number };
        const retryCount = headers?.['retry-count'] || 0;
  
        if (retryCount >= this.config.retryPolicy.maxRetries) {
          console.error('Maksimum deneme sayısına ulaşıldı:', result.correlationId);
          this.channel.nack(msg, false, false);
          return;
        }
  
        const callback = this.callbacks.get(result.correlationId);
        if (callback) {
          await callback(result);
          this.channel.ack(msg);
        } else {
          console.warn('İlgili callback bulunamadı:', result.correlationId);
          this.channel.nack(msg, false, true);
        }
      } catch (error) {
        console.error('Mesaj işleme hatası:', error);
        this.channel.nack(msg, false, true);
      }
    }
  
    registerCallback(correlationId: string, callback: (result: ProductCheckResult) => Promise<void>): void {
      this.callbacks.set(correlationId, callback);
    }
  
    unregisterCallback(correlationId: string): void {
      this.callbacks.delete(correlationId);
    }
  }