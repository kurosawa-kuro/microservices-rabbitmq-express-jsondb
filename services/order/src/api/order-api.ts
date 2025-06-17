import { Channel } from "amqplib";
import { Express, NextFunction, Request, Response } from "express"
import { PublishMessage } from '../util/broker';
import db from '../database/connection';
import { CollectionChain } from 'lodash';
import axios from 'axios';
import NodeCache from 'node-cache';

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

const OrderAPI = (app:Express, channel:Channel) => {
    // 注文一覧の取得（ユーザーと商品の詳細を含む）
    app.get('/list', async (req:Request, res:Response) => {
        try {
            const orders = (db.get('orders') as CollectionChain<Order>).value();
            
            // 注文データを並列で取得（キャッシュ付き）
            const enrichedOrders = await Promise.all(orders.map(async (order) => {
                const [user, products] = await Promise.all([
                    fetchWithCache(`user:${order.userId}`, () => 
                        axios.get<User>(`http://localhost:8000/user/${order.userId}`)
                    ),
                    Promise.all(order.products.map((product: Product) => 
                        fetchWithCache(`product:${product.productId}`, () =>
                            axios.get<ProductDetail>(`http://localhost:8000/product/${product.productId}`)
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

    // 特定の注文の取得（ユーザーと商品の詳細を含む）
    app.get('/:id', async (req:Request, res:Response) => {
        try {
            const order = (db.get('orders') as CollectionChain<Order>)
                .find({ id: parseInt(req.params.id) })
                .value();
            
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const [user, products] = await Promise.all([
                fetchWithCache(`user:${order.userId}`, () => 
                    axios.get<User>(`http://localhost:8000/user/${order.userId}`)
                ),
                Promise.all(order.products.map((product: Product) => 
                    fetchWithCache(`product:${product.productId}`, () =>
                        axios.get<ProductDetail>(`http://localhost:8000/product/${product.productId}`)
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

    // 新規注文の作成
    app.post('/', async (req:Request, res:Response) => {
        try {
            const { userId, products } = req.body;

            // ユーザーの存在確認（キャッシュ付き）
            const userResponse = await fetchWithCache(`user:${userId}`, () => 
                axios.get<User>(`http://localhost:8000/user/${userId}`)
            );
            if (!userResponse.data) {
                return res.status(404).json({ error: 'User not found' });
            }

            // 商品の存在確認と在庫チェック（キャッシュ付き）
            for (const product of products) {
                const productResponse = await fetchWithCache(`product:${product.productId}`, () =>
                    axios.get<ProductDetail>(`http://localhost:8000/product/${product.productId}`)
                );
                if (!productResponse.data) {
                    return res.status(404).json({ error: `Product ${product.productId} not found` });
                }
                if (productResponse.data.stock < product.quantity) {
                    return res.status(400).json({ error: `Insufficient stock for product ${product.productId}` });
                }
            }

            const newOrder = {
                id: (db.get('orders') as CollectionChain<Order>).value().length + 1,
                ...req.body,
                createdAt: new Date().toISOString()
            };
            
            (db.get('orders') as CollectionChain<Order>)
                .push(newOrder)
                .write();
            
            res.status(201).json(newOrder);
        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({ error: 'Failed to create order' });
        }
    });

    // メッセージブローカー関連のエンドポイント
    app.get('/ping-product', async (req:Request, res:Response, next:NextFunction) => {
        const payload = {
            event: 'PING',
            data: { msg: 'Hello from order service'}
        }
        PublishMessage(channel, 'PRODUCT-ROUTING-KEY', JSON.stringify(payload));
        return res.status(200).json({msg: 'Pinged product service'});
    });

    app.get('/ping-user', async (req:Request, res:Response, next:NextFunction) => {
        const payload = {
            event: 'PING',
            data: { msg: 'Hello from order service'}
        }
        PublishMessage(channel, 'USER-ROUTING-KEY', JSON.stringify(payload));
        return res.status(200).json({msg: 'Pinged user service'});
    });
}

export default OrderAPI; 