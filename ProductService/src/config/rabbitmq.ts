import amqp, { Connection, Channel } from 'amqplib';

export class RabbitMQConfig {
    private static instance: RabbitMQConfig;
    private connection: Connection | null = null;
    private channel: Channel | null = null;

    private constructor() {}

    static getInstance(): RabbitMQConfig {
        if (!RabbitMQConfig.instance) {
            RabbitMQConfig.instance = new RabbitMQConfig();
        }
        return RabbitMQConfig.instance;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async connect(): Promise<void> {
        const maxRetries = 5;
        const retryDelay = 5000; // 5 seconds

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
                this.connection = await amqp.connect(url);
                this.channel = await this.connection.createChannel();
                console.log('RabbitMQ connected successfully');
                return;
            } catch (error) {
                console.error(`RabbitMQ connection attempt ${attempt} failed:`, error);
                if (attempt === maxRetries) {
                    throw error;
                }
                await this.delay(retryDelay);
                console.log(`Retrying RabbitMQ connection... (Attempt ${attempt + 1}/${maxRetries})`);
            }
        }
    }

    getChannel(): Channel {
        if (!this.channel) {
            throw new Error('RabbitMQ channel is not initialized');
        }
        return this.channel;
    }

    async closeConnection(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
        } catch (error) {
            console.error('Error closing RabbitMQ connection:', error);
            throw error;
        }
    }
}