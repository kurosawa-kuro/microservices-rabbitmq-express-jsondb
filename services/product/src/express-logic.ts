import express, { Request, Response, NextFunction, Router } from 'express';
import { Channel } from 'amqplib';
import ProductAPI from './api/product-api';

const ProductExpressLogic = (app: express.Express, channel: Channel) => {
    // ミドルウェアの設定
    app.use(express.json());
    app.use((req: Request, res: Response, next: NextFunction) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });

    // APIルートの設定
    const productRouter = Router();
    ProductAPI(productRouter, channel);
    app.use('/', productRouter);

    // デフォルトルート（最後に設定）
    app.use('*', (req: Request, res: Response) => {
        res.json({ msg: 'Product service response' });
    });
};

export default ProductExpressLogic;