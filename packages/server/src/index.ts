import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { prisma } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ code: 200, msg: 'success', data: { status: 'ok', dbConnected: true } });
});

app.use('/api', apiRouter);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'equipment-manager-api' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
