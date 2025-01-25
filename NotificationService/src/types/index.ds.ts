import { Document } from 'mongoose';

export interface INotification extends Document {
    order_id: string;
    message: string;
    createdAt: Date;
}

export interface NotificationMessage {
    order_id: string;
    message: string;
}

export interface INotificationConsumer {
    initialize(): Promise<void>;
    handleMessage(message: NotificationMessage): Promise<void>;
}