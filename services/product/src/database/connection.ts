import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';

const adapter = new FileSync(path.join(__dirname, '../../json-product.db'));
const db = low(adapter);

// 初期データの設定
db.defaults({
  products: [
    {
      id: 1,
      name: 'ノートパソコン',
      description: '高性能なビジネスノートパソコン',
      price: 120000,
      stock: 10,
      category: 'electronics',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'スマートフォン',
      description: '最新のスマートフォン',
      price: 80000,
      stock: 15,
      category: 'electronics',
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'ワイヤレスイヤホン',
      description: 'ノイズキャンセリング機能付き',
      price: 25000,
      stock: 30,
      category: 'accessories',
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      name: 'スマートウォッチ',
      description: '健康管理機能付き',
      price: 35000,
      stock: 20,
      category: 'wearables',
      createdAt: new Date().toISOString()
    }
  ]
}).write();

export default db;