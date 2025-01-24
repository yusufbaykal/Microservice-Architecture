import { Channel, ConsumeMessage } from 'amqplib';
import { RabbitMQConfig } from '../../config/rabbitmq.config';
import { IEventConsumer, OrderCheckResponse } from '../../types/index.ds';

export interface MessageHeaders {
  'retry-count': number;
}

export class ProductEventConsumer implements IEventConsumer {
  private callbacks = new Map<string, (result: OrderCheckResponse) => Promise<void>>();

  constructor(
    private channel: Channel,
    private config: typeof RabbitMQConfig = RabbitMQConfig
  ) {}

  async initialize(): Promise<void> {
    await this.channel.consume(
      this.config.queues.productCheck,
      this.handleMessage.bind(this)
    );
  }

  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const result = JSON.parse(msg.content.toString()) as OrderCheckResponse;
      const headers = msg.properties.headers as MessageHeaders;
      const retryCount = headers?.['retry-count'] || 0;

      if (retryCount >= this.config.retryPolicy.maxRetries) {
        console.error('Max retry count reached:', result.correlationId);
        this.channel.nack(msg, false, false);
        return;
      }

      const callback = this.callbacks.get(result.correlationId);
      if (callback) {
        await callback(result);
        this.channel.ack(msg);
      } else {
        console.warn('Callback not found:', result.correlationId);
        this.channel.nack(msg, false, true);
      }
    } catch (error) {
      console.error('Message processing error:', error);
      this.channel.nack(msg, false, true);
    }
  }

  responseCallback(correlationId: string, callback: (result: OrderCheckResponse) => Promise<void>): void {
    this.callbacks.set(correlationId, callback);
  }

  unresponseCallback(correlationId: string): void {
    this.callbacks.delete(correlationId);
  }
}
