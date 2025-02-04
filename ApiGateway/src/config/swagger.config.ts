import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce Mikroservice API',
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
    title: 'E-Commerce Mikroservice API',
    version: '1.0.0',
    description: 'Microservice-based REST API documentation for e-commerce application',
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
        summary: 'New User Register',
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
                    default: 'admin'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'User created successfully' },
          '400': { description: 'Invalid request' }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
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
          '200': { description: 'Successful' },
          '401': { description: 'Invalid login credentials' }
        }
      }
    },
    '/api/products': {
      post: {
        tags: ['Products'],
        summary: 'Add new product',
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
          '201': { description: 'Product created successfully' },
          '400': { description: 'Invalid request' }

        }
      }
    },
    '/api/orders/create': {
      post: {
        tags: ['Orders'],
        summary: 'Create new order',
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
          '201': { description: 'Order created successfully' },
          '400': { description: 'Invalid request' }
        }
      }
    }
  }
}; 