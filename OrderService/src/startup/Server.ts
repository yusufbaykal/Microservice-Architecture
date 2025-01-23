import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from '../config/database';
import { RabbitMQConfig } from '../config/rabbitmq';
import { OrderRepository } from '../domain/Repositories/Repositories';
import { OrderEventProducer } from '../application/event/Producer';
import { OrderEventConsumer } from '../application/event/Consumer';
import { OrderSaga } from '../application/saga/Saga';
import { OrderService } from '../service/Service';
import { createOrderRouter } from '../routes/Routes';

dotenv.config();

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/order-service';

const app = express();

async function initializeDependencies() {
    try {

        const database = Database.getInstance();
        await database.connect({ MONGODB_URI });

        const rabbitMQ = RabbitMQConfig.getInstance();
        await rabbitMQ.connect();
        const channel = rabbitMQ.getChannel();

        const orderRepository = new OrderRepository();

        const eventProducer = new OrderEventProducer(channel);
        const eventConsumer = new OrderEventConsumer(channel);
        await eventConsumer.initialize();

        const orderSaga = new OrderSaga(orderRepository, eventProducer, eventConsumer);
        const orderService = new OrderService(orderSaga);

        return {
            database,
            rabbitMQ,
            orderService
        };
    } catch (error) {
        console.error('Failed to initialize dependencies:', error);
        throw error;
    }
}

async function startServer() {
    let dependencies: {
        database: Database,
        rabbitMQ: RabbitMQConfig,
        orderService: OrderService
    } | undefined;

    try {
        dependencies = await initializeDependencies();

        app.use(cors());
        app.use(express.json());

        app.get('/health', (_req, res) => {
            res.status(200).json({
                status: 'ok',
                services: {
                    database: dependencies?.database.getConnection() ? 'active' : 'inactive',
                    rabbitmq: 'active'
                }
            });
        });

        app.use('/api/orders', createOrderRouter(dependencies.orderService));

        const server = app.listen(PORT, () => {
            console.log(`Order Service is running on port ${PORT}`);
        });

        const shutdown = async (signal: string) => {
            console.log(`${signal} received. Starting graceful shutdown...`);

            server.close(async () => {
                try {
                    if (dependencies) {
                        await dependencies.rabbitMQ.closeConnection();
                        await dependencies.database.disconnect();
                    }
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