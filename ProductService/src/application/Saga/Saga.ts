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
  }

  async productCheck(orderResponse: OrderCheckResponse): Promise<IProduct> {
    const correlationId = uuidv4();

    return new Promise<IProduct>((resolve, reject) => {
      this.pendingSagas.set(correlationId, { resolve, reject });

      const timeout = setTimeout(
        () => this.handleTimeout(correlationId),
        RabbitMQConfig.retryPolicy.maxRetries * RabbitMQConfig.retryPolicy.retryDelay
      );

      this.eventConsumer.responseCallback(correlationId, async (result) => {
        try {
          clearTimeout(timeout);
          await this.processResult(result);
        } catch (error) {
          reject(error);
        } finally {
          this.pendingSagas.delete(correlationId);
        }
      });

      this.verifyAndAdjustStock(orderResponse, correlationId).catch(reject);
    });
  }

  private async verifyAndAdjustStock(orderResponse: OrderCheckResponse, correlationId: string): Promise<void> {
    try {
      const product = await this.productRepository.getProductById(orderResponse.product_id);

      if (!product) {
        throw new Error('Ürün bulunamadı');
      }

      if (product.stock < orderResponse.quantity) {
        throw new Error('Stok yetersiz');
      }

      // Stok düşüm işlemi
      product.stock -= orderResponse.quantity;
      await this.productRepository.updateProductStock(product);

      // Başarılı işlem mesajı gönder
      await this.eventProducer.sendProductCheckResponse({
        correlationId,
        status: 'success',
        product_id: orderResponse.product_id,
        quantity: orderResponse.quantity,
      });
    } catch (error) {
      await this.eventProducer.sendProductCheckResponse({
        correlationId,
        status: 'error',
        product_id: orderResponse.product_id,
        quantity: orderResponse.quantity,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async processResult(result: any): Promise<void> {
    const saga = this.pendingSagas.get(result.correlationId);
    if (!saga) return;

    try {
      if (result.status === 'success') {
        saga.resolve(result);
      } else {
        saga.reject(new Error(result.error || 'Stok kontrolü başarısız'));
      }
    } catch (error) {
      saga.reject(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private handleTimeout(correlationId: string): void {
    const saga = this.pendingSagas.get(correlationId);
    if (saga) {
      saga.reject(new Error('İşlem zaman aşımına uğradı'));
      this.pendingSagas.delete(correlationId);
      this.eventConsumer.unresponseCallback(correlationId);
    }
  }
}
