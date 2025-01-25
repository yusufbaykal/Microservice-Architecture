import { Channel, ConsumeMessage } from 'amqplib';
import { RabbitMQConfig } from '../../config/rabbitmq.config';
import { IEventConsumer, OrderCheckResponse } from '../../types/index.ds';

export interface MessageHeaders {
  'retry-count': number;
}

export class ProductEventConsumer implements IEventConsumer {
  private callbacks = new Map<string, (message: any) => Promise<void>>();

  constructor(
    private channel: Channel,
    private config: typeof RabbitMQConfig
  ) {}

  async initialize(): Promise<void> {
    console.log('Initializing consumer for queue:', this.config.queues.productCheck);
    await this.channel.consume(
      this.config.queues.productCheck,
      this.handleMessage.bind(this)
    );
  }

  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString());
      console.log('Received message:', content);

      const callback = this.callbacks.get('productCheck');
      if (callback) {
        await callback(content);
        this.channel.ack(msg);
      } else {
        console.warn('Callback not found for productCheck');
        this.channel.nack(msg, false, false);
      }
    } catch (error) {
      console.error('Message processing error:', error);
      const headers = msg.properties.headers as MessageHeaders;
      const retryCount = (headers?.['retry-count'] || 0) + 1;

      if (retryCount <= this.config.retryPolicy.maxRetries) {
        this.channel.nack(msg, false, true);
      } else {
        console.error('Max retry count reached, sending to DLQ');
        this.channel.nack(msg, false, false);
      }
    }
  }

  registerCallback(key: string, callback: (message: any) => Promise<void>): void {
    console.log('Registering callback for key:', key);
    this.callbacks.set(key, callback);
  }

  unregisterCallback(key: string): void {
    console.log('Unregistering callback for key:', key);
    this.callbacks.delete(key);
  }
}