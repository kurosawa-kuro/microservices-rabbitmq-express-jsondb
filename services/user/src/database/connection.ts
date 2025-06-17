import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';

const adapter = new FileSync(path.join(__dirname, '../../json-user.db'));
const db = low(adapter);

// 初期データの設定
db.defaults({
  users: [
    {
      id: 1,
      name: '山田太郎',
      email: 'yamada@example.com',
      role: 'user',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: '佐藤花子',
      email: 'sato@example.com',
      role: 'user',
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: '鈴木一郎',
      email: 'suzuki@example.com',
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ]
}).write();

export default db;