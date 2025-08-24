// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import adminRoutes from './routes/admin.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import postersRoutes from './routes/posters.routes.js';
import likesRoutes from './routes/likes.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import postImagesRoutes from './routes/post_images.routes.js'; // ⬅️ เพิ่มไฟล์ใหม่

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// static /uploads ให้เปิดไฟล์ได้
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/posters', postersRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', postImagesRoutes); // ⬅️ mount /api/posters/:id/images และ /api/post-images

export default app;
