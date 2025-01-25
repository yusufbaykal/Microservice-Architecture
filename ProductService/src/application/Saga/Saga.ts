import { v4 as uuidv4 } from 'uuid';
import { ProductRepository } from '../../domain/Repositories/Repositories';
import { RabbitMQConfig } from '../../config/rabbitmq.config';
import { OrderCheckResponse, IEventConsumer, IEventProducer, IProduct } from '../../types/index.ds';

interface SagaCallbacks {
  resolve: (value: IProduct | PromiseLike<IProduct>) => void;
  reject: (reason?: Error) => void;
}

export class ProductSaga {
  private pendingSagas = new Map<string, SagaCallbacks>();

  constructor(
    private productRepository: ProductRepository,
    private eventProducer: IEventProducer,
    private eventConsumer: IEventConsumer
  ) {
    this.initializeConsumer();
  }

  private async initializeConsumer(): Promise<void> {
    await this.eventConsumer.initialize();
    this.eventConsumer.registerCallback('productCheck', this.handleProductCheck.bind(this));
  }

  private async handleProductCheck(orderRequest: OrderCheckResponse): Promise<void> {
    console.log('Handling product check request:', orderRequest);
    try {
      const product = await this.productRepository.getProductById(orderRequest.product_id);

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.stock < orderRequest.quantity) {
        throw new Error('Insufficient stock');
      }

      product.stock -= orderRequest.quantity;
      await this.productRepository.updateProductStock(product);

      const quantity = typeof orderRequest.quantity === 'string' ? parseInt(orderRequest.quantity) : orderRequest.quantity;
      
      const total = quantity * product.price;

      await this.eventProducer.sendProductCheckResponse({
        correlationId: orderRequest.correlationId,
        status: 'success',
        product_id: orderRequest.product_id,
        quantity: quantity,
        total: total
      });
    } catch (error) {
      console.error('Error in handleProductCheck:', error);
      await this.eventProducer.sendProductCheckResponse({
        correlationId: orderRequest.correlationId,
        status: 'error',
        product_id: orderRequest.product_id,
        quantity: orderRequest.quantity,
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async productCheck(orderResponse: OrderCheckResponse): Promise<IProduct> {
    try {
      console.log('Starting product check for:', orderResponse);
      const product = await this.verifyAndAdjustStock(orderResponse);
      return product;
    } catch (error) {
      console.error('Product check failed:', error);
      throw error;
    }
  }

  private async verifyAndAdjustStock(orderResponse: OrderCheckResponse): Promise<IProduct> {
    const product = await this.productRepository.getProductById(orderResponse.product_id);

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < orderResponse.quantity) {
      throw new Error('Insufficient stock');
    }

    product.stock -= orderResponse.quantity;
    return await this.productRepository.updateProductStock(product);
  }
}
