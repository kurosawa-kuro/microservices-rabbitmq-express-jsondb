import express, { Express, Request, Response, NextFunction, Router } from "express";
import cors from 'cors';
import ProductAPI from "./api/product-api";
import { Channel } from "amqplib";

const ExpressLogic = async (app:Express, channel:Channel) => {
    app.use(express.json({ limit: '1mb' }));
    app.use(cors());

    // ルーターを作成してAPIを設定
    const router = Router();
    ProductAPI(router, channel);
    app.use('/products', router);

    // デフォルトルートは最後に設定
    app.use('*', (req:Request, res:Response, next:NextFunction)=>{
        return res.status(200).json({msg: 'Product service response'});
    });
}

export default ExpressLogic;