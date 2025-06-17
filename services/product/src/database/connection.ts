import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';

const adapter = new FileSync(path.join(__dirname, '../../json-product.db'));
const db = low(adapter);

// 初期データの設定（カクヤス向け酒類サンプル）
db.defaults({
  products: [
    {
      id: 1,
      name: 'アサヒ スーパードライ 350ml 缶',
      description: '爽快なのどごしが特徴の定番ビール',
      price: 228,           // 1本あたり税込参考価格
      stock: 120,
      category: 'beer',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'サントリー ザ・プレミアム・モルツ 350ml 缶',
      description: '華やかな香りと深いコクのプレミアムビール',
      price: 278,
      stock: 90,
      category: 'beer',
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'サントリー 角瓶 700ml',
      description: 'ハイボール用として人気の国産ブレンデッドウイスキー',
      price: 1398,
      stock: 40,
      category: 'whisky',
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      name: 'ニッカ フロム・ザ・バレル 500ml',
      description: 'アルコール度数51.4％、重厚な味わいのモルト＆グレーン',
      price: 4190,
      stock: 25,
      category: 'whisky',
      createdAt: new Date().toISOString()
    },
    {
      id: 5,
      name: '獺祭 純米大吟醸45 720ml',
      description: '華やかな香りと繊細な甘みが特徴の山口県産日本酒',
      price: 2050,
      stock: 30,
      category: 'sake',
      createdAt: new Date().toISOString()
    },
    {
      id: 6,
      name: '高清水 上撰 1.8L パック',
      description: '晩酌用に人気のコスパ抜群パック清酒',
      price: 1680,
      stock: 50,
      category: 'sake',
      createdAt: new Date().toISOString()
    },
    {
      id: 7,
      name: 'こだわり酒場のレモンサワー 350ml 缶',
      description: '居酒屋レシピそのままのしっかりレモンサワー',
      price: 148,
      stock: 100,
      category: 'chuhai',
      createdAt: new Date().toISOString()
    },
    {
      id: 8,
      name: 'モンテス・アルファ カベルネ・ソーヴィニヨン 750ml',
      description: 'チリを代表するフルボディ赤ワイン',
      price: 2280,
      stock: 18,
      category: 'wine',
      createdAt: new Date().toISOString()
    }
  ]
}).write();


export default db;