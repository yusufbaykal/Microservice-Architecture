import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from '../config/database';
import { RabbitMQConfig } from '../config/rabbitmq';
import { ProductRepository } from '../domain/Repositories/Repositories';
import { ProductEventProducer } from '../application/Event/Producer';
import { ProductEventConsumer } from '../application/Event/Consumer';
import { ProductSaga } from '../application/Saga/Saga';
import { ProductService } from '../service/Service';
import { ProductController } from '../controller/Controller';
import { Router } from 'express';

dotenv.config();

const PORT = process.env.PORT as string;
const MONGODB_URI = process.env.MONGODB_URI as string;

if (!PORT || !MONGODB_URI) {
  throw new Error('Environment variables PORT and MONGODB_URI must be set');
}

const app = express();

function createRouter(productService: ProductService): Router {
    const router = Router();
    const productController = new ProductController(productService);
    router.post('/products', (req, res) => productController.createProduct(req, res));
    return router;
}

async function initializeDependencies() {
    try {
        const database = Database.getInstance();
        await database.connect({ MONGODB_URI });

        const rabbitMQ = RabbitMQConfig.getInstance();
        await rabbitMQ.connect();
        const channel = rabbitMQ.getChannel();

        const productRepository = new ProductRepository();
        const eventProducer = new ProductEventProducer(channel);
        const eventConsumer = new ProductEventConsumer(channel);
        await eventConsumer.initialize();

        const productSaga = new ProductSaga(productRepository, eventProducer, eventConsumer);
        const productService = new ProductService(productRepository);

        return {
            database,
            rabbitMQ,
            productService
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
        productService: ProductService
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

        app.use('/api/product', createRouter(dependencies.productService));

        const server = app.listen(PORT, () => {
            console.log(`Product Service is running on port ${PORT}`);
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