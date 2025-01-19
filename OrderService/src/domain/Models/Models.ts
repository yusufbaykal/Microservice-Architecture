import mongoose from 'mongoose';

export enum OrderStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface IOrder extends Document{
    _id?: mongoose.Types.ObjectId;
    product_id: string,
    status: OrderStatus,
    quantity: number,
    total: number,
    createdAt: Date,
    updatedAt: Date
}

export interface IOrderWithoutId extends Omit<IOrder, '_id'> {}


export interface IOrderDocument extends IOrder, Document {
    _id: mongoose.Types.ObjectId;
  }

const OrderSchema = new mongoose.Schema({
    product_id: {type: String,required: true},
    status: {type: String,required: true,enum: Object.values(OrderStatus),default: OrderStatus.PENDING},
    quantity: {type: Number,required: true},
    total: {type: Number,required: true},
    },{
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt'
    }
});

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema); 
