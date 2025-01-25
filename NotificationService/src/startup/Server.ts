import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import Database from '../config/database';
import { RabbitMQConfig, initializeRabbitMQ } from '../config/rabbitmq.config';
import { RabbitMQ } from '../config/rabbitmq';
import { NotificationEventConsumer } from '../application/event/Consumer';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

interface Dependencies {
    database: Database;
    rabbitMQ: RabbitMQ;
    notificationConsumer: NotificationEventConsumer;
}

async function initializeDependencies(): Promise<Dependencies> {
    try {
        const database = Database.getInstance();
        await database.connect({ MONGODB_URI: MONGODB_URI as string });

        const rabbitMQ = RabbitMQ.getInstance();
        await rabbitMQ.connect();
        const channel = rabbitMQ.getChannel();
        
        await initializeRabbitMQ(channel);

        const notificationConsumer = new NotificationEventConsumer(
            channel,
            RabbitMQConfig,
        );

        await notificationConsumer.initialize();

        return {
            database,
            rabbitMQ,
            notificationConsumer
        };
    } catch (error) {
        console.error('Failed to initialize dependencies:', error);
        throw error;
    }
}

async function startServer() {
    let dependencies: Dependencies;

    try {
        dependencies = await initializeDependencies();

        const app = express();

        app.use(cors());
        app.use(helmet());
        app.use(express.json());

        app.get('/health', (_req, res) => {
            res.status(200).json({
                status: 'ok',
                services: {
                    database: dependencies.database.getConnection() ? 'active' : 'inactive',
                    rabbitmq: 'active'
                }
            });
        });

        const server = app.listen(PORT, () => {
            console.log(`Notification Service is running on port ${PORT}`);
        });

        const shutdown = async (signal: string) => {
            console.log(`${signal} received. Starting graceful shutdown...`);

            server.close(async () => {
                try {
                    await dependencies.rabbitMQ.closeConnection();
                    await dependencies.database.disconnect();
                    console.log('Graceful shutdown completed');
                    process.exit(0);
                } catch (error) {
                    console.error('Error during shutdown:', error);
                    process.exit(1);
                }
            });
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        console.error('Server startup error:', error);
        process.exit(1);
    }
}

startServer();