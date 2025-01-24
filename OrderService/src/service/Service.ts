import { OrderSaga } from '../application/saga/Saga';
import { IOrder } from '../types/index.ds';

export class OrderService {
  constructor(private saga: OrderSaga) {}

  async createOrder(data: IOrder): Promise<IOrder> {
    try {
      const order = await this.saga.start(data);
      return order;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Bilinmeyen hata');
    }
  }
}