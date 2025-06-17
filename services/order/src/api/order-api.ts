import { Channel } from "amqplib";
import { Express, NextFunction, Request, Response } from "express"
import { PublishMessage } from '../util/broker';
import db from '../database/connection';
import { CollectionChain } from 'lodash';

const OrderAPI = (app:Express, channel:Channel) => {
    // 注文一覧の取得
    app.get('/list', (req:Request, res:Response) => {
        const orders = (db.get('orders') as CollectionChain<any>).value();
        res.json(orders);
    });

    // 特定の注文の取得
    app.get('/:id', (req:Request, res:Response) => {
        const order = (db.get('orders') as CollectionChain<any>)
            .find({ id: parseInt(req.params.id) })
            .value();
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(order);
    });

    // 新規注文の作成
    app.post('/', (req:Request, res:Response) => {
        const newOrder = {
            id: (db.get('orders') as CollectionChain<any>).value().length + 1,
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        (db.get('orders') as CollectionChain<any>)
            .push(newOrder)
            .write();
        
        res.status(201).json(newOrder);
    });

    // メッセージブローカー関連のエンドポイント
    app.get('/ping-product', async (req:Request, res:Response, next:NextFunction) => {
        const payload = {
            event: 'PING',
            data: { msg: 'Hello from order service'}
        }
        PublishMessage(channel, 'PRODUCT-ROUTING-KEY', JSON.stringify(payload));
        return res.status(200).json({msg: 'Pinged product service'});
    });

    app.get('/ping-user', async (req:Request, res:Response, next:NextFunction) => {
        const payload = {
            event: 'PING',
            data: { msg: 'Hello from order service'}
        }
        PublishMessage(channel, 'USER-ROUTING-KEY', JSON.stringify(payload));
        return res.status(200).json({msg: 'Pinged user service'});
    });
}

export default OrderAPI; 