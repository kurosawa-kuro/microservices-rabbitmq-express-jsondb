import { Channel } from "amqplib";
import { Router, NextFunction, Request, Response } from "express"
import UserService from "../service/user-service";
import { SubscribeMessage, PublishMessage } from "../util/broker";

const UserAPI = (router:Router, channel:Channel) => {

    const userService = new UserService();

    SubscribeMessage(channel,userService);

    router.get('/list', async (req:Request, res:Response, next:NextFunction) => {
        const result = await userService.GetUserList();
        return res.status(200).json({result});
    });

    router.get('/:id', async (req:Request, res:Response, next:NextFunction) => {
        const result = await userService.GetUser({ id: req.params.id });
        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(result);
    });

    router.get('/ping-client', async (req:Request, res:Response, next:NextFunction) => {
        const payload = {
            event: 'PING',
            data: { msg: 'Hello from user service'}
        }
        PublishMessage(channel, 'CLIENT-ROUTING-KEY', JSON.stringify(payload));
        return res.status(200).json({msg: 'Pinged client service'});
    });

    router.get('/ping-product', async (req:Request, res:Response, next:NextFunction) => {
        const payload = {
            event: 'PING',
            data: { msg: 'Hello from user service'}
        }
        PublishMessage(channel, 'PRODUCT-ROUTING-KEY', JSON.stringify(payload));
        return res.status(200).json({msg: 'Pinged product service'});
    });
}

export default UserAPI;