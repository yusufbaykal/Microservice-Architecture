import { ProductModel } from '../Models/Models';
import { IProduct } from '../../types/index.ds';

export interface IProductRepository {
    createProduct(product: IProduct): Promise<IProduct>;
    updateProductStock(product: IProduct): Promise<IProduct>;
    deleteProduct(id: string): Promise<void>;
    getProductById(id: string): Promise<IProduct>;
    findAll(): Promise<IProduct[]>;
}

export class ProductRepository implements IProductRepository {
    async createProduct(product: IProduct): Promise<IProduct> {
        const createdProduct = await ProductModel.create(product);
        return createdProduct.toObject();
    }

    async updateProductStock(product: IProduct): Promise<IProduct> {
        const updatedProduct = await ProductModel.findByIdAndUpdate(product._id, product, { new: true });
        if (!updatedProduct) {
            throw new Error('Product not found');
        }
        return updatedProduct.toObject();
    }

    async deleteProduct(id: string): Promise<void> {
        const result = await ProductModel.findByIdAndDelete(id);
        if (!result) {
            throw new Error('Product not found');
        }
    }

    async getProductById(id: string): Promise<IProduct> {
        const product = await ProductModel.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }
        return product.toObject();
    }

    async findAll(): Promise<IProduct[]> {
        const products = await ProductModel.find();
        return products.map(product => product.toObject());
    }
}