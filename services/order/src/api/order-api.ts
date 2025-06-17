import { Channel } from "amqplib";
import { Express, NextFunction, Request, Response, Router } from "express"
import { PublishMessage } from '../util/broker';
import db from '../database/connection';
import { CollectionChain } from 'lodash';
import axios from 'axios';
import NodeCache from 'node-cache';
import express from 'express';

// キャッシュの設定（TTL: 30秒）
const cache = new NodeCache({ stdTTL: 30 });

interface Product {
    productId: number;
    quantity: number;
    price: number;
}

interface Order {
    id: number;
    userId: number;
    products: Product[];
    totalAmount: number;
    status: string;
    createdAt: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface ProductDetail {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
}

interface UserDetail {
    id: number;
    name: string;
    email: string;
    role: string;
}

// キャッシュ付きのAPI呼び出し関数
async function fetchWithCache<T>(key: string, fetchFn: () => Promise<{ data: T }>): Promise<{ data: T }> {
    const cached = cache.get<T>(key);
    if (cached) {
        console.log(`Cache hit for key: ${key} - Data:`, JSON.stringify(cached));
        return { data: cached };
    }

    console.log(`Cache miss for key: ${key} - Fetching from service...`);
    const response = await fetchFn();
    console.log(`Caching data for key: ${key} - Data:`, JSON.stringify(response.data));
    cache.set(key, response.data);
    return response;
}

const OrderAPI = (router: Router, channel: Channel) => {
    // 注文一覧の取得（ユーザーと商品の詳細を含む）
    router.get('/list', async (req: Request, res: Response) => {
        try {
            const orders = (db.get('orders') as CollectionChain<Order>).value();
            
            // 注文データを並列で取得（キャッシュ付き）
            const enrichedOrders = await Promise.all(orders.map(async (order) => {
                const [user, products] = await Promise.all([
                    fetchWithCache(`user:${order.userId}`, () => 
                        axios.get<User>(`http://localhost:8001/user/${order.userId}`)
                    ),
                    Promise.all(order.products.map((product: Product) => 
                        fetchWithCache(`product:${product.productId}`, () =>
                            axios.get<ProductDetail>(`http://localhost:8003/product/${product.productId}`)
                        )
                    ))
                ]);

                return {
                    ...order,
                    user: user.data,
                    products: order.products.map((product: Product, index: number) => ({
                        ...product,
                        details: products[index].data
                    }))
                };
            }));

            res.json(enrichedOrders);
        } catch (error) {
            console.error('Error fetching order details:', error);
            res.status(500).json({ error: 'Failed to fetch order details' });
        }
    });

    // 注文作成エンドポイント
    router.post('/', async (req: Request, res: Response) => {
        try {
            console.log('Request headers:', req.headers);
            console.log('Request body:', req.body);
            console.log('Content-Type:', req.headers['content-type']);

            const { userId, products } = req.body;

            // リクエストボディのバリデーション
            if (!userId) {
                console.log('Validation error: userId is missing');
                return res.status(400).json({ error: 'userId is required' });
            }

            if (!products || !Array.isArray(products) || products.length === 0) {
                console.log('Validation error: products array is invalid');
                return res.status(400).json({ error: 'products array is required and must not be empty' });
            }

            // 商品データのバリデーション
            for (const product of products) {
                if (!product.productId || !product.quantity) {
                    return res.status(400).json({ 
                        error: 'Each product must have productId and quantity' 
                    });
                }
            }

            // ユーザー存在確認
            const userResponse = await fetchWithCache<UserDetail>(`user:${userId}`, () => 
                axios.get<UserDetail>(`http://localhost:8001/user/${userId}`)
            );
            if (!userResponse.data) {
                return res.status(404).json({ error: 'User not found' });
            }

            // 商品情報の取得と在庫チェック
            const orderProducts = [];
            let totalAmount = 0;

            for (const product of products) {
                const productResponse = await fetchWithCache<ProductDetail>(
                    `product:${product.productId}`,
                    () => axios.get<ProductDetail>(`http://localhost:8003/product/${product.productId}`)
                );

                if (!productResponse.data) {
                    return res.status(404).json({ error: `Product ${product.productId} not found` });
                }

                if (productResponse.data.stock < product.quantity) {
                    return res.status(400).json({ error: `Insufficient stock for product ${product.productId}` });
                }

                // 商品価格を使用
                const productTotal = productResponse.data.price * product.quantity;
                totalAmount += productTotal;

                orderProducts.push({
                    productId: product.productId,
                    quantity: product.quantity,
                    price: productResponse.data.price
                });
            }

            // 注文データの作成
            const order = {
                id: Date.now(),
                userId,
                products: orderProducts,
                totalAmount,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            // 注文データの保存
            (db.get('orders') as CollectionChain<Order>).push(order).write();

            // メッセージキューへの通知
            // 1. 在庫更新メッセージ
            await PublishMessage(channel, 'stock_queue', JSON.stringify({
                type: 'STOCK_UPDATE',
                data: {
                    orderId: order.id,
                    products: order.products.map(p => ({
                        productId: p.productId,
                        quantity: p.quantity
                    }))
                }
            }));

            // 2. ユーザー通知メッセージ
            await PublishMessage(channel, 'notification_queue', JSON.stringify({
                type: 'ORDER_CREATED',
                data: {
                    orderId: order.id,
                    userId: order.userId,
                    totalAmount: order.totalAmount
                }
            }));

            // 3. 注文完了メッセージ
            await PublishMessage(channel, 'order_queue', JSON.stringify({
                type: 'ORDER_COMPLETE',
                data: {
                    orderId: order.id,
                    status: 'completed'
                }
            }));

            res.status(201).json(order);
        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({ error: 'Failed to create order' });
        }
    });

    // 注文詳細の取得
    router.get('/:id', async (req: Request, res: Response) => {
        try {
            const order = (db.get('orders') as CollectionChain<Order>)
                .find({ id: parseInt(req.params.id) })
                .value();
            
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const [user, products] = await Promise.all([
                fetchWithCache(`user:${order.userId}`, () => 
                    axios.get<User>(`http://localhost:8001/user/${order.userId}`)
                ),
                Promise.all(order.products.map((product: Product) => 
                    fetchWithCache(`product:${product.productId}`, () =>
                        axios.get<ProductDetail>(`http://localhost:8003/product/${product.productId}`)
                    )
                ))
            ]);

            const enrichedOrder = {
                ...order,
                user: user.data,
                products: order.products.map((product: Product, index: number) => ({
                    ...product,
                    details: products[index].data
                }))
            };
            
            res.json(enrichedOrder);
        } catch (error) {
            console.error('Error fetching order details:', error);
            res.status(500).json({ error: 'Failed to fetch order details' });
        }
    });

    // ユーザーサービスの疎通確認
    router.get('/ping-user', async (req: Request, res: Response) => {
        const payload = {
            event: 'PING',
            data: { msg: 'Hello from order service'}
        }
        PublishMessage(channel, 'USER-ROUTING-KEY', JSON.stringify(payload));
        return res.status(200).json({msg: 'Pinged user service'});
    });

    // 商品サービスの疎通確認
    router.get('/ping-product', async (req: Request, res: Response) => {
        const payload = {
            event: 'PING',
            data: { msg: 'Hello from order service'}
        }
        PublishMessage(channel, 'PRODUCT-ROUTING-KEY', JSON.stringify(payload));
        return res.status(200).json({msg: 'Pinged product service'});
    });
};

export default OrderAPI; 