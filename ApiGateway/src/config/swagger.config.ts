import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Ticaret Basic Mikroservis API',
      version: '1.0.0',
      description: 'E-Ticaret uygulaması için mikroservis tabanlı REST API dokümantasyonu',
    },
    servers: [
      {
        url: 'http://localhost:3003',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/routes/*.ts'],
};

export const specs = swaggerJsdoc(options);

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'E-Ticaret Basic Mikroservis API',
    version: '1.0.0',
    description: 'E-Ticaret uygulaması için mikroservis tabanlı REST API dokümantasyonu',
  },
  servers: [
    {
      url: 'http://localhost:3003',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{
    bearerAuth: [],
  }],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Yeni kullanıcı kaydı',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                  role: { 
                    type: 'string',
                    enum: ['user', 'admin'],
                    default: 'user'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Kullanıcı başarıyla oluşturuldu' },
          '400': { description: 'Geçersiz istek' }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Kullanıcı girişi',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string', format: 'password' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Başarılı giriş' },
          '401': { description: 'Geçersiz kimlik bilgileri' }
        }
      }
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'Tüm ürünleri listele',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Ürün listesi başarıyla getirildi' }
        }
      },
      post: {
        tags: ['Products'],
        summary: 'Yeni ürün ekle',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'description', 'price', 'stock', 'category_name', 'image'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number' },
                  stock: { type: 'number' },
                  category_name: { type: 'string' },
                  image: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Ürün başarıyla oluşturuldu' }
        }
      }
    },
    '/api/orders/create': {
      post: {
        tags: ['Orders'],
        summary: 'Yeni sipariş oluştur',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['product_id', 'quantity'],
                properties: {
                  product_id: { type: 'string' },
                  quantity: { type: 'number' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Sipariş başarıyla oluşturuldu' },
          '400': { description: 'Geçersiz istek' }
        }
      }
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Bildirimleri listele',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Bildirimler başarıyla getirildi' }
        }
      }
    }
  }
}; 