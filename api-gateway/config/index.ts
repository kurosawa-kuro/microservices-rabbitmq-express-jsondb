import dotenv from 'dotenv';

if(process.env.NODE_ENV !== 'production') {
    const cfg = `./.env.${process.env.NODE_ENV}`;
    dotenv.config({path: cfg});
}else {
    dotenv.config();
}

export default {
    PORT: process.env.PORT || 8000,
    USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:8001',
    ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL || 'http://localhost:8002',
    PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8003'
}