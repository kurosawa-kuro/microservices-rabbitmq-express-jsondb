import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import OrderAPI from './api/order-api';
import dbConnection from './database/connection';
import { CreateChannel } from './util/broker';

const app = express();
const port = process.env.PORT || 8002;

// 環境変数の読み込み
const envFile = process.env.NODE_ENV === 'prod' ? '.env.prod' : '.env.dev';
dotenv.config({ path: path.join(__dirname, `../${envFile}`) });

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
    const channel = await CreateChannel();
    const router = express.Router();
    OrderAPI(router, channel);
    app.use('/order', router);

    app.listen(port, () => {
      console.log(`Running server in mode: ${process.env.NODE_ENV}`);
      console.log(`Order service running at port ${port}`);
    }).on('error', (err: Error) => {
      console.log(err);
      process.exit();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
