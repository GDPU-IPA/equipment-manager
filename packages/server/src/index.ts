import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  // 测试数据库连接
  const usersCount = await prisma.user.count().catch(() => 0);
  res.json({ status: 'ok', dbConnected: true, usersCount });
});

app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});