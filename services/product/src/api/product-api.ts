import { Channel } from "amqplib";
import { Router, NextFunction, Request, Response } from "express"
import { PublishMessage } from "../util/broker";
import db from "../database/connection";
import { CollectionChain } from "lodash";

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    createdAt: string;
}

const ProductAPI = (router:Router, channel:Channel) => {

    // 商品一覧の取得
    router.get('/list', (req: Request, res: Response) => {
        try {
            const products = (db.get('products') as CollectionChain<Product>).value();
            res.json(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    });

    // 特定の商品の取得
    router.get('/:id', (req: Request, res: Response) => {
        try {
            const product = (db.get('products') as CollectionChain<Product>)
                .find({ id: parseInt(req.params.id) })
                .value();
            
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            res.json(product);
        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({ error: 'Failed to fetch product' });
        }
    });

    router.get('/ping-client', async (req:Request, res:Response, next:NextFunction) => {
        const payload = {
            event: 'PING',
            data: { msg: 'Hello from product service'}
        }
        PublishMessage(channel, 'CLIENT-ROUTING-KEY', JSON.stringify(payload));
        return res.status(200).json({msg: 'Pinged client service'});
    });

    router.get('/ping-user', async (req:Request, res:Response, next:NextFunction) => {
        const payload = {
            event: 'PING',
            data: { msg: 'Hello from product service'}
        }
        PublishMessage(channel, 'USER-ROUTING-KEY', JSON.stringify(payload));
        return res.status(200).json({msg: 'Pinged user service'});
    });
}

export default ProductAPI;