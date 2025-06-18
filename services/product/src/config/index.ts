import dotenv from 'dotenv';
import path from 'path';

// 環境変数の読み込み
const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
dotenv.config({ path: path.join(__dirname, `../../${envFile}`) });

console.log('Config loaded with environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB: process.env.DB,
  MESSAGE_BROKER_URL: process.env.MESSAGE_BROKER_URL
});

export default {
  PORT: process.env.PORT || 8002,
  DB: process.env.DB || '',
  MESSAGE_BROKER_URL: process.env.MESSAGE_BROKER_URL || 'amqp://localhost'
}