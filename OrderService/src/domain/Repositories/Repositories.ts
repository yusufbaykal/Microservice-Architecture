import { IOrder, OrderModel } from '../Models/Models';

export interface IOrderRepository {
    create(order: IOrder): Promise<IOrder>;
    findById(id: string): Promise<IOrder | null>;
    findByProductId(productId: string): Promise<IOrder | null>;
    updateStatus(id: string, status: string): Promise<IOrder | null>;
}

export class OrderRepository implements IOrderRepository {

    async create(order: Partial<IOrder>): Promise<IOrder> {
        try {
            const createdOrder = await OrderModel.create(order);
            return createdOrder.toObject();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Repository Create Error';
            throw new Error(`Repository Create Error: ${errorMessage}`);
        }
    }

    async findById(id: string): Promise<IOrder | null> {
        try {
            const order = await OrderModel.findOne({_id: id});
            return order ? order.toObject() : null; 
        }
        catch(err) {
            const errorMessage = err instanceof Error ? err.message : 'Repository FindById Error';
            throw new Error(`Repository FindById Error: ${errorMessage}`);
        }
    }

    async findByProductId(productId: string): Promise<IOrder | null> {
        try {
            const order = await OrderModel.findOne({ product_id: productId });
            return order ? order.toObject() : null;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Repository FindByProductId Error';
            throw new Error(`Repository FindByProductId Error: ${errorMessage}`);
        }
    }

    async updateStatus(id: string, status: string): Promise<IOrder | null> {
        try {
            const order = await OrderModel.findOneAndUpdate({_id: id}, {status: status}, {new: true});
            return order ? order.toObject() : null;
        }
        catch(err) {
            const errorMessage = err instanceof Error ? err.message : 'Repository UpdateStatus Error';
            throw new Error(`Repository UpdateStatus Error: ${errorMessage}`);
        }
    }
}