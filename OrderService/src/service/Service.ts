import { Request, Response } from 'express';
import { OrderSaga } from '../application/saga/Saga';

export class OrderService {
    async createOrder(req: Request, res: Response) {
        try {
            const { product_id, quantity, total } = req.body;
            
            const order = await OrderSaga.start({
                product_id,
                quantity,
                total
            });
            
            res.status(201).json(order);
        } catch (error: unknown) {
            console.error('Error creating order:', error);
            res.status(400).json({ 
                error: (error instanceof Error ? error.message : 'An error occurred while creating the order')
            });
        }
    }
}