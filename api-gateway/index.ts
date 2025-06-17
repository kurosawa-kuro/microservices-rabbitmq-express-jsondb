import express from 'express';
import cors from 'cors';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import http from 'http';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// リクエストログミドルウェア
app.use((req, res, next) => {
    console.log(`[Gateway] ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// サービス設定
const services = {
    user: 'http://localhost:8001',
    order: 'http://localhost:8002',
    product: 'http://localhost:8003'
};

// プロキシミドルウェアの作成
const createServiceProxy = (target: string, pathRewrite: Record<string, string>) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite,
        secure: false,
        onProxyReq: (proxyReq: http.ClientRequest, req: express.Request) => {
            if (req.body && Object.keys(req.body).length) {
                fixRequestBody(proxyReq, req);
            }
        }
    } as any);
};

// ユーザーサービスのルート
app.use('/user', createServiceProxy(services.user, {
    '^/user': '/users'
}));

// 注文サービスのルート
app.use('/order', createServiceProxy(services.order, {
    '^/order': '/order'
}));

// 商品サービスのルート
app.use('/product', createServiceProxy(services.product, {
    '^/product': '/products'
}));

// デフォルトルート
app.use('*', (req, res) => {
    console.log(`[Gateway] Default route hit: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
    console.log(`Gateway running at port ${port}`);
});