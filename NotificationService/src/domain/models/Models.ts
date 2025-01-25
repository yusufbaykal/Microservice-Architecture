import mongoose, { Schema, Document } from 'mongoose';
import { INotification } from '../../types/index.ds';

const NotificationSchema = new Schema({
    order_id: {type: String,required: true},
    message: {type: String,required: true}
}, {
    timestamps: true
});

export const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema); 