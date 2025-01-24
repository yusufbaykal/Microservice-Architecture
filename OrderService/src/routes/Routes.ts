import { Router } from 'express';
import { OrderController } from '../controller/Controller';
import { OrderService } from '../service/Service';
import { OrderSaga } from '../application/saga/Saga';
import { OrderRepository } from '../domain/Repositories/Repositories';
import { OrderEventProducer } from '../application/event/Producer';
import { OrderEventConsumer } from '../application/event/Consumer';
import { Channel } from 'amqplib';
import { RabbitMQConfig } from '../config/rabbitmq.config';
import { RabbitMQ } from '../config/rabbitmq';

export function createOrderRouter(
    channel: Channel,
    config: typeof RabbitMQConfig,
    rabbit: RabbitMQ
): Router {
    const router = Router();
    
    const orderRepository = new OrderRepository();
    const eventProducer = new OrderEventProducer(channel, config, rabbit);
    const eventConsumer = new OrderEventConsumer(channel, config, rabbit);
    
    const orderSaga = new OrderSaga(orderRepository, eventProducer, eventConsumer);
    const orderService = new OrderService(orderSaga);
    const orderController = new OrderController(orderService);

    router.post('/create', (req, res) => orderController.createOrder(req, res));

    return router;
}