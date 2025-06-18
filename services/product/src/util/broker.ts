import amqplib, { Channel, ConsumeMessage } from 'amqplib';
import config from '../config';
import ProductService from '../service/product-service';

const MESSAGE_BROKER_URL = config.MESSAGE_BROKER_URL;
const EXCHANGE_NAME = 'MICROSERVICES-BASE';
const QUEUE_NAME = 'PRODUCT-QUEUE';
const ROUTING_KEY = 'PRODUCT-ROUTING-KEY';

export const CreateChannel = async () => {
    try {
        console.log('Connecting to RabbitMQ at:', MESSAGE_BROKER_URL);
        const connection = await amqplib.connect(MESSAGE_BROKER_URL);
        console.log('Successfully connected to RabbitMQ');
        
        console.log('Creating channel...');
        const channel = await connection.createChannel();
        console.log('Channel created successfully');
        
        console.log('Asserting exchange:', EXCHANGE_NAME);
        await channel.assertExchange(EXCHANGE_NAME, 'direct');
        console.log('Exchange asserted successfully');
        
        return channel;
    } catch(err) {
        console.error('Error in CreateChannel:', err);
        throw err;
    }
}

export const PublishMessage = async (channel:Channel, routing_key:string, message:any) => {
    console.log('Publishing message to routing key:', routing_key);
    try {
        channel.publish(EXCHANGE_NAME, routing_key, Buffer.from(message));
        console.log('Message published successfully');
    } catch(err) {
        console.error('Error in PublishMessage:', err);
        throw err;
    }
}

export const SubscribeMessage = async (channel:Channel, service:ProductService) => {
    console.log('Setting up message subscription...');
    try {
        const queue = await channel.assertQueue(QUEUE_NAME);
        console.log('Queue asserted:', queue.queue);
        
        channel.bindQueue(queue.queue, EXCHANGE_NAME, ROUTING_KEY);
        console.log('Queue bound to exchange');
        
        channel.consume(queue.queue, (data:ConsumeMessage | null) => {
            if(data) {
                console.log('Consumer received data');
                service.HandlePayload(data.content.toString());
                channel.ack(data);
            }
        });
        console.log('Message subscription setup completed');
    } catch(err) {
        console.error('Error in SubscribeMessage:', err);
        throw err;
    }
}