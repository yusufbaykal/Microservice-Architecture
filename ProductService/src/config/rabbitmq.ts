import amqp, { Connection, Channel } from 'amqplib';

export class RabbitMQConfig {
    private static instance: RabbitMQConfig;
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private isClosing: boolean = false;

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
                
                this.connection.on('error', (err) => {
                    console.error('RabbitMQ connection error:', err);
                    if (!this.isClosing) {
                        this.reconnect();
                    }
                });

                this.connection.on('close', () => {
                    console.log('RabbitMQ connection closed');
                    if (!this.isClosing) {
                        this.reconnect();
                    }
                });

                this.channel = await this.connection.createChannel();
                this.channel.on('error', (err) => {
                    console.error('RabbitMQ channel error:', err);
                });

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

    private async reconnect(): Promise<void> {
        if (this.isClosing) return;
        
        console.log('Attempting to reconnect to RabbitMQ...');
        try {
            await this.connect();
        } catch (error) {
            console.error('Reconnection failed:', error);
            // Exponential backoff ile tekrar dene
            await this.delay(5000);
            this.reconnect();
        }
    }

    getChannel(): Channel {
        if (!this.channel) {
            throw new Error('RabbitMQ channel is not initialized');
        }
        return this.channel;
    }

    async closeConnection(): Promise<void> {
        this.isClosing = true;
        
        try {
            if (this.channel) {
                try {
                    await this.channel.close();
                } catch (error) {
                    console.warn('Channel may already be closing:', error);
                }
                this.channel = null;
            }

            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }
            
            console.log('RabbitMQ connection closed successfully');
        } catch (error) {
            console.error('Error during RabbitMQ shutdown:', error);
            throw error;
        } finally {
            this.isClosing = false;
        }
    }
}