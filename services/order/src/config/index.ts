import dotenv from 'dotenv';
import path from 'path';

if(process.env.NODE_ENV !== 'production') {
    const cfg = path.join(__dirname, `../../.env.${process.env.NODE_ENV}`);
    dotenv.config({path: cfg});
    console.log('Loading environment from:', cfg);
}else {
    dotenv.config();
}

export default {
    PORT: process.env.PORT || 8003,
    DB: process.env.DB || '',
    MESSAGE_BROKER_URL: process.env.MESSAGE_BROKER_URL || 'amqp://localhost',
    USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:8001',
    PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8002',
    ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL || 'http://localhost:8003'
}