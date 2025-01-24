import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Channel } from 'amqplib';
import { createOrderRouter } from '../routes/Routes';
import Database from '../config/database';
import { RabbitMQConfig } from '../config/rabbitmq.config';
import { RabbitMQ } from '../config/rabbitmq';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Environment variable MONGODB_URI must be set');
}

interface Dependencies {
  database: Database;
  rabbitMQConfig: typeof RabbitMQConfig;
  channel: Channel;
  rabbitMQ: RabbitMQ;
}

async function initializeDependencies(): Promise<Dependencies> {
  try {
    const database = Database.getInstance();
    await database.connect({ MONGODB_URI: MONGODB_URI as string });

    const rabbitMQ = RabbitMQ.getInstance();
    await rabbitMQ.connect();
    const channel = rabbitMQ.getChannel();

    return {
      database,
      rabbitMQ,
      channel,
      rabbitMQConfig: RabbitMQConfig,
    };
  } catch (error) {
    console.error('Failed to initialize dependencies:', error);
    throw error;
  }
}

async function startServer() {
  let dependencies: Dependencies | undefined;

  try {
    dependencies = await initializeDependencies();

    const app = express();

    app.use(cors());
    app.use(express.json());

    app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'ok',
        services: {
          database: dependencies?.database.getConnection() ? 'active' : 'inactive',
          rabbitmq: 'active',
        },
      });
    });

    if (dependencies) {
      app.use(
        '/api/orders',
        createOrderRouter(dependencies.channel, RabbitMQConfig, dependencies.rabbitMQ)
      );
    }

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
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
