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
      clientId: 1,
      products: [
        {
          productId: 1,
          quantity: 2,
          price: 15000
        }
      ],
      totalAmount: 30000,
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      clientId: 2,
      products: [
        {
          productId: 2,
          quantity: 1,
          price: 25000
        },
        {
          productId: 3,
          quantity: 3,
          price: 5000
        }
      ],
      totalAmount: 40000,
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      clientId: 3,
      products: [
        {
          productId: 1,
          quantity: 1,
          price: 15000
        }
      ],
      totalAmount: 15000,
      status: 'processing',
      createdAt: new Date().toISOString()
    }
  ]
}).write();

export default db; 