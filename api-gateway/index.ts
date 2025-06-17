import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// サービス設定
const services = {
  user: 'http://localhost:8001',
  order: 'http://localhost:8002',
  product: 'http://localhost:8003'
};

// ユーザーサービスのルート
app.use('/user', createProxyMiddleware({
  target: services.user,
  changeOrigin: true,
  pathRewrite: {
    '^/user': ''
  }
}));

// 注文サービスのルート
app.use('/order', createProxyMiddleware({
  target: services.order,
  changeOrigin: true,
  pathRewrite: {
    '^/order': ''
  }
}));

// 商品サービスのルート
app.use('/product', createProxyMiddleware({
  target: services.product,
  changeOrigin: true,
  pathRewrite: {
    '^/product': ''
  }
}));

app.listen(port, () => {
  console.log(`Gateway running at port ${port}`);
});