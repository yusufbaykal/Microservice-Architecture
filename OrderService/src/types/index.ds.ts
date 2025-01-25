import mongoose from 'mongoose';

export enum OrderStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface OrderCreateRequest {
    product_id: string;
    quantity: number;
    total: number;
}

export interface ProductCheckResult {
    product_id: string;
    correlationId: string;
    status: string;
    error?: string;
    quantity: number;
    total: number;
}

export interface IOrder extends Document {
    _id?: mongoose.Types.ObjectId;
    product_id: string;
    status: OrderStatus;
    quantity: number;
    total: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IEventProducer {
    sendProductCheckRequest(data: { 
        product_id: string; 
        quantity: number;
        correlationId: string;
    }): Promise<void>;
    sendNotification(order: IOrder): Promise<void>;
}

export interface IEventConsumer {
    initialize(): Promise<void>;
    registerCallback(correlationId: string, callback: (result: ProductCheckResult) => Promise<void>): void;
    unregisterCallback(correlationId: string): void;
}