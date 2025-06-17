import express from 'express';
import dbConnection from './database/connection';
import ExpressLogic from './express-logic';
import config from './config';
import { CreateChannel } from './util/broker';

const Start = async() => {
    console.log(`Running server in mode: ${process.env.NODE_ENV}`);
    const app = express();
    
    // データベース接続の初期化
    const db = dbConnection;
    console.log('Database initialized');
    
    const channel = await CreateChannel();
    
    await ExpressLogic(app, channel);
    
    app.listen(config.PORT, ()=>{
        console.log(`User service running at port ${config.PORT}`);
    }).on('error', (err:Error) => {
        console.log(err);
        process.exit();
    });
}

Start();
