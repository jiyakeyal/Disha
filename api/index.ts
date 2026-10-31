import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from '../server/routes.js';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount router on both /api and root to handle Vercel rewrite variations
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
