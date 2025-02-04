# E-Commerce Microservices Architecture

This project implements a modern core e-commerce system using microservices architecture. The system provides consistent data management across distributed services using the principles of Event Driven Architecture and Saga Pattern.
## Architectural Structure

The system consists of the following microservices:

### API Gateway
- Entry point for all external requests
- JWT-based authentication and authorization
- Request routing and load balancing
- Rate limiting and security measures
- API documentation with Swagger UI

### Product Service
- Product management and inventory control
- Event-driven inventory updates
- Order validation processes

### Order Service
- Order processing and management
- Distributed transaction management with Saga pattern
- Event-driven order status updates

### Notification Service
- Asynchronous notification management
- Order status change tracking
- Event-driven notification delivery

## Event-Driven Architecture and Saga Pattern

### Order Creation Process

1. Customer creates an order through the API Gateway
2. Order Service receives the order and initiates the Saga
3. Event is sent to Product Service for inventory check
4. Product Service checks inventory status:
   - If stock is sufficient: Updates inventory and returns positive response
   - If stock is insufficient: Returns error response
5. Order Service based on the response:
   - Success case: Confirms order and triggers Notification Service
   - Failure case: Cancels the order
6. Notification Service generates relevant notifications

### Error Handling and Compensation Mechanisms

- Each service has its own database (MongoDB)
- Asynchronous communication via RabbitMQ
- Dead Letter Queue (DLQ) for failed event management
- Retry mechanism for temporary failure compensation
- Distributed transaction consistency with Saga pattern

## Technology Stack

- Node.js & TypeScript
- Express.js
- MongoDB
- RabbitMQ
- Docker
- JWT Authentication
- Swagger UI

## Getting Started

### Requirements

- Docker
- Node.js 14+
- MongoDB
- RabbitMQ

### Installation

1. Clone the project
```bash
git clone <repo-url>
```

2. Create .env files for each service:

API Gateway (.env):
```
PORT=3003
JWT_SECRET=your_jwt_secret
MONGODB_URI=mongodb://mongodb:27017/api-gateway
PRODUCT_SERVICE_URL=http://product-service:3000
ORDER_SERVICE_URL=http://order-service:3001
NOTIFICATION_SERVICE_URL=http://notification-service:3002
```

Product Service (.env):
```
PORT=3000
MONGODB_URI=mongodb://mongodb:27017/product-service
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

Order Service (.env):
```
PORT=3001
MONGODB_URI=mongodb://mongodb:27017/order-service
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

Notification Service (.env):
```
PORT=3002
MONGODB_URI=mongodb://mongodb:27017/notification-service
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

3. Start services with Docker Compose:

```bash
docker-compose build
```

```bash
docker-compose up -d
```

## API Documentation

Access the API documentation through Swagger UI:
```
http://localhost:3003/api-docs
```

## Service Health Check

Health check endpoints for each service:
- API Gateway: http://localhost:3003/health
- Product Service: http://localhost:3000/health
- Order Service: http://localhost:3001/health
- Notification Service: http://localhost:3002/health

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting
- Security headers with Helmet.js
- CORS configuration

## Asynchronous Communication Details

### RabbitMQ Exchange and Queue Structure

- Product Exchange: Product and inventory events
- Order Exchange: Order events
- Notification Exchange: Notification events
- Dead Letter Exchange: Failed message management

### Retry Policy

- Maximum retry attempts: 3
- Retry interval: 5 seconds
- Dead Letter Queue routing

## Contributing

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request
