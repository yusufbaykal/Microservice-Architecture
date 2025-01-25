import mongoose from 'mongoose';

export interface OrderCheckResponse {
    product_id: string; 
    quantity: number;
    correlationId: string;
}

export interface IProduct extends Document {
    _id?: mongoose.Types.ObjectId;
    name: string;
    description: string;
    price: number;
    stock: number;
    category_name: string;
    image: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IEventConsumer {
    initialize(): Promise<void>;
    registerCallback(correlationId: string, callback: (result: OrderCheckResponse) => Promise<void>): void;
    unregisterCallback(correlationId: string): void;
}

export interface IEventProducer {
    sendProductCheckResponse(data: { 
        product_id: string; 
        quantity: number;
        correlationId: string;
        status: string;
        error?: string;
        total: number;
    }): Promise<void>;
}