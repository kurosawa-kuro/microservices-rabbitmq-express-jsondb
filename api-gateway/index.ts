import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import http from 'http';
import bodyParser from 'body-parser';
import config from './config';

const app = express();

// CORS設定
app.use(cors());

// リクエストボディのパース
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ログミドルウェア
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// サービスURLの設定
const services = {
    user: config.USER_SERVICE_URL,
    order: config.ORDER_SERVICE_URL,
    product: config.PRODUCT_SERVICE_URL
};

// プロキシミドルウェアの作成
const createServiceProxy = (target: string, pathRewrite: Record<string, string>) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite
    });
};

// サービスルートの設定
app.use('/user', createServiceProxy(services.user, {
    '^/user': '/'  // /user → / に書き換え
}));

app.use('/order', createServiceProxy(services.order, {
    '^/order': '/'  // /order → / に書き換え
}));

app.use('/product', createServiceProxy(services.product, {
    '^/product': '/'  // /product → / に書き換え
}));

// デフォルトルート
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// エラーハンドリング
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// サーバーの起動
const port = config.PORT || 8000;
const server = http.createServer(app);

server.listen(port, () => {
    console.log(`API Gateway is running on port ${port}`);
    console.log('Service URLs:');
    console.log('User Service:', services.user);
    console.log('Order Service:', services.order);
    console.log('Product Service:', services.product);
});