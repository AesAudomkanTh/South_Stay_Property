// src/sockets/io.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { saveMessage } from '../services/chat.service.js';

export function initSocket(httpServer, app, {
  path = '/socket.io',
  jwtSecret = process.env.JWT_SECRET || 'devsecret',
  corsOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173',
} = {}) {
  const io = new Server(httpServer, {
    path,
    cors: {
      origin: corsOrigin,       // ให้ตรงกับ origin ของ frontend
      credentials: true,
    },
    // ใน dev บางเครื่องอัปเกรด websocket ไม่ผ่าน ให้ปล่อย polling ได้
    transports: ['polling', 'websocket'],
  });

  // เผื่อ REST route (เช่น POST /api/chat/dm) จะเรียก io ได้ผ่าน req.app.get('io')
  app.set('io', io);

  // -------- auth ทุกการเชื่อมต่อ ----------
  io.use((socket, next) => {
    try {
      const token = socket.handshake?.auth?.token || socket.handshake?.headers?.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) return next(new Error('NO_TOKEN'));

      const payload = jwt.verify(token, jwtSecret);
      if (!payload?.user_id) return next(new Error('INVALID_TOKEN'));

      socket.user = { user_id: payload.user_id };
      return next();
    } catch (err) {
      return next(err);
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.user_id;
    // เข้าห้องส่วนตัวของ user นี้
    socket.join(`user:${userId}`);

    // ดีบัก
    // console.log('[socket] connected', socket.id, 'user:', userId);

    // ---- realtime DM ----
    socket.on('dm', async (payload, reply) => {
      try {
        const { to_user_id, text } = payload || {};
        const clean = (text || '').trim();

        if (!to_user_id || !clean) {
          if (reply) reply({ ok: false, error: 'INVALID_INPUT' });
          return;
        }
        if (to_user_id === userId) {
          if (reply) reply({ ok: false, error: 'CANNOT_MESSAGE_SELF' });
          return;
        }
        if (clean.length > 2000) {
          if (reply) reply({ ok: false, error: 'MESSAGE_TOO_LONG' });
          return;
        }

        // บันทึก DB
        await saveMessage(userId, to_user_id, clean);
        const at = new Date().toISOString();

        // ส่งให้ "ผู้รับ"
        io.to(`user:${to_user_id}`).emit('dm', {
          from: userId,
          text: clean,
          at,
        });

        // echo ให้ "ผู้ส่ง" (อีกแท็บ/อีกหน้าจอ sync)
        io.to(`user:${userId}`).emit('dm:self', {
          to: to_user_id,
          text: clean,
          at,
        });

        if (reply) reply({ ok: true });
      } catch (err) {
        console.error('[socket] dm error:', err);
        if (reply) reply({ ok: false, error: 'INTERNAL_ERROR' });
      }
    });

    socket.on('disconnect', (reason) => {
      // console.log('[socket] disconnected', socket.id, reason);
    });
  });

  return io;
}
