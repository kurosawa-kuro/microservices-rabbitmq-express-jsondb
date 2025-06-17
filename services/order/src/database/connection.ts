import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';

const adapter = new FileSync(path.join(__dirname, '../../json-order.db'));
const db = low(adapter);

// 初期データの設定
db.defaults({
  orders: [
    {
      id: 1,
      userId: 1, // 山田太郎の注文
      products: [
        {
          productId: 1, // ノートパソコン
          quantity: 2,
          price: 120000
        }
      ],
      totalAmount: 240000,
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      userId: 2, // 佐藤花子の注文
      products: [
        {
          productId: 2, // スマートフォン
          quantity: 1,
          price: 80000
        },
        {
          productId: 3, // ワイヤレスイヤホン
          quantity: 3,
          price: 25000
        }
      ],
      totalAmount: 155000,
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      userId: 3, // 鈴木一郎の注文
      products: [
        {
          productId: 4, // スマートウォッチ
          quantity: 1,
          price: 35000
        }
      ],
      totalAmount: 35000,
      status: 'processing',
      createdAt: new Date().toISOString()
    }
  ]
}).write();

export default db; 