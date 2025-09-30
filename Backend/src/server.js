// src/server.js
import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

dotenv.config();

const server = http.createServer(app);

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const IO_ORIGINS = (process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : DEV_ORIGINS);

const io = new Server(server, {
  path: '/socket.io',
  cors: { origin: IO_ORIGINS, credentials: true },
  transports: ['polling', 'websocket'], // เริ่มด้วย polling แล้ว upgrade
});

// ✅ ใช้ secret เดียวกันกับตอน sign
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'devsecret';

// verify JWT + เข้าห้องส่วนตัว
io.use((socket, next) => {
  const raw =
    socket.handshake.auth?.token ||
    (socket.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '') ||
    null;

  if (!raw) return next(new Error('NO_TOKEN'));

  try {
    const payload = jwt.verify(raw, ACCESS_SECRET);
    if (!payload?.user_id) return next(new Error('JWT_NO_USER_ID'));
    socket.data.user = { user_id: String(payload.user_id) };
    socket.join(`user:${socket.data.user.user_id}`);
    return next();
  } catch (err) {
    console.warn('[socket] JWT_VERIFY_FAILED:', err?.message || err);
    return next(new Error('JWT_VERIFY_FAILED'));
  }
});

io.on('connection', (socket) => {
  const me = socket.data.user?.user_id;
  console.log('[socket] connected:', socket.id, 'user:', me);

  socket.on('dm', ({ to_user_id, text }, ack) => {
    const from  = socket.data.user?.user_id;
    const clean = typeof text === 'string' ? text.trim() : '';
    if (!from) return ack?.({ ok: false, error: 'NOT_AUTH' });
    if (!to_user_id || !clean) return ack?.({ ok: false, error: 'INVALID_INPUT' });
    if (String(to_user_id) === String(from)) return ack?.({ ok: false, error: 'CANNOT_MESSAGE_SELF' });

    const at = new Date().toISOString();

    io.to(`user:${String(to_user_id)}`).emit('dm', { from, text: clean, at });
    io.to(`user:${String(from)}`).emit('dm:self', { to: String(to_user_id), text: clean, at });

    return ack?.({ ok: true });
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected:', reason);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`API & Socket.IO listening on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));
process.on('uncaughtException',  (err) => console.error('[uncaughtException]',  err));
