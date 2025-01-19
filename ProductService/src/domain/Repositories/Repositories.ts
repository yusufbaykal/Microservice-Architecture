import { IProduct, ProductModel } from '../Models/Models';

export interface IProductRepository {
    create(product: IProduct): Promise<IProduct>;
    update(product: IProduct): Promise<IProduct>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<IProduct>;
    findAll(): Promise<IProduct[]>;
}

export class ProductRepository implements IProductRepository {
    async create(product: IProduct): Promise<IProduct> {
        const createdProduct = await ProductModel.create(product);
        return createdProduct.toObject();
    }

    async update(product: IProduct): Promise<IProduct> {
        const updatedProduct = await ProductModel.findByIdAndUpdate(product._id, product, { new: true });
        if (!updatedProduct) {
            throw new Error('Product not found');
        }
        return updatedProduct.toObject();
    }

    async delete(id: string): Promise<void> {
        const result = await ProductModel.findByIdAndDelete(id);
        if (!result) {
            throw new Error('Product not found');
        }
    }

    async findById(id: string): Promise<IProduct> {
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