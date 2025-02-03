import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/config';
import { swaggerDocument } from './config/swagger.config';
import routes from './routes';

function createApp() {
    const app = express();

    app.use(cors());
    app.use(helmet());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const limiter = rateLimit({
        windowMs: config.rateLimiting.windowMs,
        max: config.rateLimiting.max,
    });
    app.use(limiter);

    // Swagger UI
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerDocument));

    app.use('/', routes);

    app.get('/health', (_req: Request, res: Response) => {
        res.json({
            status: 'OK',
            message: 'API Gateway is running',
            services: {
                database: mongoose.connection.readyState === 1 ? 'active' : 'inactive'
            }
        });
    });

    app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
        console.error('Error:', err);
        res.status(500).json({
            status: 'error',
            message: config.nodeEnv === 'production' ? 
                'Internal Server Error' : 
                err.message
        });
        next();
    });

    return app;
}

async function startServer() {
    try {
        await mongoose.connect(config.mongodb.uri);
        console.log('MongoDB connection established');

        const app = createApp();
        const server = app.listen(config.port, () => {
            console.log(`API Gateway is running on port ${config.port}`);
        });

        const shutdown = async (signal: string) => {
            console.log(`${signal} received. Starting graceful shutdown...`);
            server.close(async () => {
                try {
                    await mongoose.disconnect();
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
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();