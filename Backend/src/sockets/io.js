import { Server } from 'socket.io';
import { saveMessage } from '../services/chat.service.js';
import jwt from 'jsonwebtoken';

export function createIO(httpServer) {
  const io = new Server(httpServer, { cors: { origin:/*"*"*/ process.env.CORS_ORIGIN, credentials: true } });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = payload;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.user_id}`);

    socket.on('dm', async ({ to_user_id, text }) => {
      if (!to_user_id || !text) return;
      await saveMessage(socket.user.user_id, to_user_id, text);
      io.to(`user:${to_user_id}`).emit('dm', { from: socket.user.user_id, text, at: new Date().toISOString() });
      socket.emit('dm:ack', { to: to_user_id, text, at: new Date().toISOString() });
    });
  });

  return io;
}
