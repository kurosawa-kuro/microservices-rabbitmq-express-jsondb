# microservices-base-rabbitmq

Basic microservices project that includes a gateway (api-gateway) and 3 microservices (user/product/order) and a messaging queue

This variation utilizes RabbitMQ as the messaging queue so if one microservice goes down, it will receive messages when it gets back up.

### Prerequisites

- Install [Node.js](https://nodejs.org/en/)
- Install [RabbitMQ](https://www.rabbitmq.com/) or run it in a Docker container with the included compose file. Alternatively you can use their cloud solution at [CloudAMQP](https://www.cloudamqp.com/)

### Installing

- Clone the repository

```
git clone https://github.com/19EB/microservices-base
```

- Install dependencies on api-gateway

```
cd api-gateway
npm install
```

- Install dependencies on each microservice (user, product and order)
```
cd services/<microservice>
npm install
```

### Environment variables

This project uses the following environment variables:

##### api-gateway
```
# Port
PORT=8000

# User service
USER_SERVICE_URL='http://localhost:8001'

# Order service
ORDER_SERVICE_URL='http://localhost:8002'

# Product service
PRODUCT_SERVICE_URL='http://localhost:8003'
```

##### microservice
```
# Database
DB=''

# Service port
PORT=8001

# RabbitMQ configuration (use local or cloud url here)
MESSAGE_BROKER_URL=''
```

### Running the project

- If you plan on using Docker for running RabbitMQ, I have included "rabbitmq" folder that contains the docker-compose file.

```
cd rabbitmq
docker-compose up -d
```

- Start each microservice from its own directory

Development mode
```
cd services/<microservice>
npm run dev
```

Production mode
```
cd services/<microservice>
npm start
```

- Start the api-gateway
```
cd api-gateway
npm start
or
npm run dev
```

### API Endpoints

You can access the services either directly or through the API Gateway.

#### Direct Access
- User Service (Port 8001):
  - `GET http://localhost:8001/user/list`
  - `GET http://localhost:8001/user/ping-order`
  - `GET http://localhost:8001/user/ping-product`

- Order Service (Port 8002):
  - `GET http://localhost:8002/order/list`
  - `POST http://localhost:8002/order` (Create order)
  - `GET http://localhost:8002/order/ping-user`
  - `GET http://localhost:8002/order/ping-product`

- Product Service (Port 8003):
  - `GET http://localhost:8003/product/list`
  - `GET http://localhost:8003/product/ping-user`
  - `GET http://localhost:8003/product/ping-order`

#### API Gateway Access (Port 8000)
All services can be accessed through the API Gateway using the following endpoints:

- User Service:
  - `GET http://localhost:8000/user/list`
  - `GET http://localhost:8000/user/ping-order`
  - `GET http://localhost:8000/user/ping-product`

- Order Service:
  - `GET http://localhost:8000/order/list`
  - `POST http://localhost:8000/order` (Create order)
  - `GET http://localhost:8000/order/ping-user`
  - `GET http://localhost:8000/order/ping-product`

- Product Service:
  - `GET http://localhost:8000/product/list`
  - `GET http://localhost:8000/product/ping-user`
  - `GET http://localhost:8000/product/ping-order`

### Example API Usage

#### Create Order
```http
POST http://localhost:8000/order
Content-Type: application/json
Accept: application/json

{
  "userId": 1,
  "products": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

## License

This project is licensed under the MIT License
