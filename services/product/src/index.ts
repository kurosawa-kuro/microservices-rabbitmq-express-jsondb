import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import ProductAPI from './api/product-api';
import dbConnection from './database/connection';
import { CreateChannel } from './util/broker';

const app = express();
const port = process.env.PORT || 8002;

// 環境変数の読み込み
const envFile = process.env.NODE_ENV === 'prod' ? '.env.prod' : '.env.dev';
dotenv.config({ path: path.join(__dirname, `../${envFile}`) });

// 環境変数の確認
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MESSAGE_BROKER_URL: process.env.MESSAGE_BROKER_URL,
  USER_SERVICE_URL: process.env.USER_SERVICE_URL,
  PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL,
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL
});

app.use(cors());
app.use(express.json());

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// データベース接続の初期化
const db = dbConnection;
console.log('Database initialized');

const startServer = async () => {
  try {
    console.log('Attempting to connect to RabbitMQ...');
    const channel = await CreateChannel();
    console.log('Successfully connected to RabbitMQ');
    
    const router = express.Router();
    ProductAPI(router, channel);
    app.use('/product', router);

    app.listen(port, () => {
      console.log(`Running server in mode: ${process.env.NODE_ENV}`);
      console.log(`Product service running at port ${port}`);
    }).on('error', (err: Error) => {
      console.error('Server error:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
