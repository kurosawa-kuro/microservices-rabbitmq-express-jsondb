import express, { Express, Request, Response, NextFunction } from "express";
import cors from 'cors';
import OrderAPI from "./api/order-api";
import { Channel } from "amqplib";

const ExpressLogic = async (app:Express, channel:Channel) => {

    app.use(express.json({ limit: '1mb' }));
    app.use(cors());

    OrderAPI(app, channel);

    app.use('*', (req:Request, res:Response, next:NextFunction)=>{
        return res.status(200).json({msg: 'Order service response'});
    });
    
}

export default ExpressLogic;