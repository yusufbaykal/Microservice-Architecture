import { Channel, ConsumeMessage } from 'amqplib';
import { RabbitMQConfig } from '../../config/rabbitmq.config';
import { IEventConsumer, ProductCheckResult } from '../../types/index.ds';
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
      console.log('Initializing OrderEventConsumer...');
      console.log('Consuming from queue:', this.config.queues.orderResponse);
      
      await this.channel.consume(
        this.config.queues.orderResponse,
        this.handleMessage.bind(this)
      );
    }
  
    private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
      if (!msg) return;
  
      try {
        const content = msg.content.toString();
        console.log('Received message:', content);
  
        const result = JSON.parse(content) as ProductCheckResult;
        console.log('Processing message with correlationId:', result.correlationId);
  
        const headers = msg.properties.headers as MessageHeaders;
        const retryCount = headers?.['retry-count'] || 0;
  
        if (retryCount >= this.config.retryPolicy.maxRetries) {
          console.error('Maximum retry count reached for correlationId:', result.correlationId);
          this.channel.nack(msg, false, false);
          return;
        }
  
        const callback = this.callbacks.get(result.correlationId);
        if (callback) {
          console.log('Found callback for correlationId:', result.correlationId);
          await callback(result);
          this.channel.ack(msg);
          console.log('Message processed successfully');
        } else {
          console.warn('No callback found for correlationId:', result.correlationId);
          this.channel.nack(msg, false, true);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        this.channel.nack(msg, false, true);
      }
    }
  
    registerCallback(correlationId: string, callback: (result: ProductCheckResult) => Promise<void>): void {
      console.log('Registering callback for correlationId:', correlationId);
      this.callbacks.set(correlationId, callback);
    }
  
    unregisterCallback(correlationId: string): void {
      console.log('Unregistering callback for correlationId:', correlationId);
      this.callbacks.delete(correlationId);
    }
  }