import express, { Express, Request, Response, NextFunction } from "express";
import cors from 'cors';
import OrderAPI from "./api/order-api";
import { Channel } from "amqplib";

const ExpressLogic = async (app: Express, channel: Channel) => {
    // リクエストログミドルウェア
    app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`[Order Service] ${req.method} ${req.path}`);
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        next();
    });

    // ミドルウェアの設定
    app.use(express.json({ limit: '1mb' }));
    app.use(cors());

    // OrderAPIの設定
    const router = express.Router();
    OrderAPI(router, channel);
    
    // 注文サービスのルートにマウント
    app.use('/', router);

    // デフォルトルート
    app.use('*', (req: Request, res: Response, next: NextFunction) => {
        console.log(`[Order Service] Default route hit: ${req.method} ${req.path}`);
        return res.status(200).json({ msg: 'Order service response' });
    });
}

export default ExpressLogic;