import mongoose, { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    description: string;
    price: number;
    stock: number;
    category_name: string;
    image: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category_name: { type: String, required: true },
    image: { type: String, required: true },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

export const ProductModel = model<IProduct>('Product', ProductSchema);