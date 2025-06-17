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
    PORT: process.env.PORT || 8002,
    DB: process.env.DB || '',
    MESSAGE_BROKER_URL: process.env.MESSAGE_BROKER_URL || 'amqp://localhost'
}