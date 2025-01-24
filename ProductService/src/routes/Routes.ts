import { Router } from 'express';
import { ProductRepository } from '../domain/Repositories/Repositories';
import { ProductService } from '../service/Service';
import { ProductController } from '..//controller/Controller';

const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);
const productController = new ProductController(productService);

const router = Router();

router.post('/products', (req, res) => productController.createProduct(req, res));

export default router;