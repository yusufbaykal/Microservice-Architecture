import { Router } from 'express';
import { ProductController } from '..//controller/Controller';

export function createProductRouter(productController: ProductController): Router {
    const router = Router();
    
    router.post('/', (req, res) => 
        productController.createProduct(req, res)
    );

    return router;
}