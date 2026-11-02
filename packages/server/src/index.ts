import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { prisma } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;
const webDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../web/dist',
);

app.use(cors());
app.use(express.json());

// app.get('/api/health', async (_req, res) => {
//   await prisma.$queryRaw`SELECT 1`;
//   res.json({ code: 200, msg: 'success', data: { status: 'ok', dbConnected: true } });
// });

app.use('/api', apiRouter);

app.use(
  express.static(webDist, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.startsWith(path.join(webDist, 'assets') + path.sep)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }),
);

app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(webDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
