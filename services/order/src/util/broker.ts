import amqplib, { Channel, ConsumeMessage, Connection } from 'amqplib';
import config from '../config';
import OrderService from '../service/order-service';

const MESSAGE_BROKER_URL = process.env.MESSAGE_BROKER_URL || 'amqp://rabbitmq';
const EXCHANGE_NAME = 'MICROSERVICES-BASE';
const QUEUE_NAME = 'ORDER-QUEUE'
const ROUTING_KEY = 'ORDER-ROUTING-KEY'

let connection: Connection | null = null;

const connectWithRetry = async (retries = 5, delay = 5000): Promise<Connection> => {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempting to connect to RabbitMQ (attempt ${i + 1}/${retries})...`);
            const conn = await amqplib.connect(MESSAGE_BROKER_URL);
            console.log('Successfully connected to RabbitMQ');
            return conn;
        } catch (err) {
            console.error(`Failed to connect to RabbitMQ (attempt ${i + 1}/${retries}):`, err);
            if (i < retries - 1) {
                console.log(`Retrying in ${delay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw err;
            }
        }
    }
    throw new Error('Failed to connect to RabbitMQ after all retries');
};

export const CreateChannel = async () => {
    try {
        if (!connection) {
            connection = await connectWithRetry();
        }
        const channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        console.log('Channel created and queue asserted');
        return channel;
    } catch(err) {
        console.error('Failed to create channel:', err);
        throw err;
    }
}

export const PublishMessage = async (channel:Channel, routing_key:string, message:any) => {
    console.log('Publishing message to:', routing_key);
    try {
        channel.publish(EXCHANGE_NAME, routing_key, Buffer.from(JSON.stringify(message)), {
            persistent: true
        });
        console.log('Message published successfully');
    } catch(err) {
        console.error('Failed to publish message:', err);
        throw err;
    }
}

export const SubscribeMessage = async (channel:Channel, service:OrderService) => {
    try {
        await channel.consume(QUEUE_NAME, async (data:ConsumeMessage | null) => {
            if(data) {
                console.log('Consumer received data');
                try {
                    const { eventType, payload } = JSON.parse(data.content.toString());
                    switch (eventType) {
                        case 'PING':
                            await service.ReceivePing(payload);
                            break;
                        default:
                            console.log('Unknown event type:', eventType);
                            break;
                    }
                    channel.ack(data);
                } catch (err) {
                    console.error('Error processing message:', err);
                    channel.nack(data);
                }
            }
        });
        console.log('Successfully subscribed to queue');
    } catch (err) {
        console.error('Failed to subscribe to queue:', err);
        throw err;
    }
}