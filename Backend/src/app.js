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
import postImagesRoutes from './routes/post_images.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import chatRoutes from './routes/chat.routes.js';


const app = express();

// ── CORS allowlist: env > default (localhost/127.0.0.1:5173)
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const ALLOWLIST = (process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : DEV_ORIGINS);

const corsOptions = {
  origin(origin, cb) {
    if (!origin || ALLOWLIST.includes(origin)) return cb(null, true);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors(corsOptions));
// ไม่จำเป็นต้องมี app.options('*', ...) — cors() จัดการให้แล้ว
// ถ้าจะคง preflight เอง ให้ใช้ RegExp แทนสตริง wildcard:
// app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// serve /uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// health
app.get('/health', (_, res) => res.json({ ok: true }));

// mount routes (ครั้งเดียวต่อชุด)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/posters', postersRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', postImagesRoutes);    // <-- ข้างใน router ต้องเริ่มด้วย /posters..., /post-images...
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

export default app;
