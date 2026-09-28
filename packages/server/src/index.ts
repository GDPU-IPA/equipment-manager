import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use('/api', apiRouter)

app.get('/', async (req: any, res: any) => {
  res.send('Hello')
});


app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});