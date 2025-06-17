import { Channel } from "amqplib";
import { Router, NextFunction, Request, Response } from "express"
import ProductService from "../service/product-service";
import { SubscribeMessage, PublishMessage } from "../util/broker";

const ProductAPI = (router:Router, channel:Channel) => {

    const productService = new ProductService();
    SubscribeMessage(channel, productService);

    router.get('/list', async (req:Request, res:Response, next:NextFunction) => {
        const result = await productService.GetProductList();
        return res.status(200).json({result});
    });

    router.get('/:id', async (req:Request, res:Response, next:NextFunction) => {
        const result = await productService.GetProduct({ id: req.params.id });
        if (!result) {
            return res.status(404).json({ error: 'Product not found' });
        }
        return res.status(200).json(result);
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