import amqplib, { Channel, ConsumeMessage } from 'amqplib';
import config from '../config';
import OrderService from '../service/order-service';

const MESSAGE_BROKER_URL = config.MESSAGE_BROKER_URL;
const EXCHANGE_NAME = 'MICROSERVICES-BASE';
const QUEUE_NAME = 'ORDER-QUEUE'
const ROUTING_KEY = 'ORDER-ROUTING-KEY'

export const CreateChannel = async () => {
    try {
        const connection = await amqplib.connect(MESSAGE_BROKER_URL);
        const channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'direct');
        await channel.assertQueue(QUEUE_NAME);
        return channel;
    }catch(err) {
        console.log(err);
        throw err;
    }
}

export const PublishMessage = async (channel:Channel, routing_key:string, message:any) => {
    console.log('Message published');
    try {
        channel.publish(EXCHANGE_NAME, routing_key, Buffer.from(message));
    }catch(err) {
        throw err;
    }
}

export const SubscribeMessage = async (channel:Channel, service:OrderService) => {
    await channel.consume(QUEUE_NAME, async (data:ConsumeMessage | null) => {
        if(data) {
            console.log('Consumer received data');
            const { eventType, payload } = JSON.parse(data.content.toString());
            switch (eventType) {
                case 'PING':
                    await service.ReceivePing(payload);
                    break;
                default:
                    break;
            }
            channel.ack(data);
        }
    });
}