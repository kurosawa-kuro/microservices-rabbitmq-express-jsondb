import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';

const adapter = new FileSync(path.join(__dirname, '../../json-client.db'));
const db = low(adapter);

// 初期データの設定
db.defaults({
  clients: [
    {
      id: 1,
      name: '株式会社テック',
      email: 'tech@example.com',
      type: 'corporate',
      address: '東京都渋谷区',
      phone: '03-1234-5678',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'デジタルソリューションズ',
      email: 'digital@example.com',
      type: 'corporate',
      address: '東京都新宿区',
      phone: '03-2345-6789',
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: '山田商事',
      email: 'yamada@example.com',
      type: 'retail',
      address: '大阪府大阪市',
      phone: '06-1234-5678',
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      name: '佐藤商店',
      email: 'sato@example.com',
      type: 'retail',
      address: '福岡県福岡市',
      phone: '092-123-4567',
      createdAt: new Date().toISOString()
    }
  ]
}).write();

export default db;