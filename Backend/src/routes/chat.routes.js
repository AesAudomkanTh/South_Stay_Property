// src/routes/chat.routes.js
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { saveMessage, getConversations, getMessages } from '../services/chat.service.js';

const r = Router();

/** รายชื่อบทสนทนาพร้อมจำนวนยังไม่อ่าน */
r.get('/conversations', requireAuth, async (req, res) => {
  try {
    const out = await getConversations(req.user.user_id);
    res.json(out);
  } catch (err) {
    console.error('[chat] GET /conversations error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/** ประวัติแชทกับคู่สนทนา + มาร์คว่าอ่านแล้ว */
r.get('/history/:peer_id', requireAuth, async (req, res) => {
  try {
    let lim = Number.parseInt(req.query.limit, 10);
    if (!Number.isFinite(lim) || lim <= 0) lim = 100;
    if (lim > 200) lim = 200;

    const rows = await getMessages(req.user.user_id, req.params.peer_id, lim);
    res.json(rows);
  } catch (err) {
    console.error('[chat] GET /history/:peer_id error:', {
      user_id: req.user?.user_id,
      peer_id: req.params?.peer_id,
      err,
    });
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/** ส่งข้อความทาง HTTP (บันทึก DB + ยิง realtime ถ้าปลายทางออนไลน์) */
r.post('/dm', requireAuth, async (req, res) => {
  try {
    const { to_user_id, text } = req.body || {};
    if (!to_user_id || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'INVALID_INPUT' });
    }
    if (to_user_id === req.user.user_id) {
      return res.status(400).json({ error: 'CANNOT_MESSAGE_SELF' });
    }

    const clean = text.trim();
    if (clean.length > 2000) {
      return res.status(413).json({ error: 'MESSAGE_TOO_LONG' });
    }

    await saveMessage(req.user.user_id, to_user_id, clean);

    const io = req.app.get('io');
    if (io) {
      const at = new Date().toISOString();

      // ส่งให้ "ผู้รับ"
      io.to(`user:${to_user_id}`).emit('dm', {
        from: req.user.user_id,
        text: clean,
        at,
      });

      // ✅ echo ให้ "ผู้ส่ง" เอง (เช่นอีกแท็บ/อีกหน้าจอ sync UI)
      io.to(`user:${req.user.user_id}`).emit('dm:self', {
        to: to_user_id,
        text: clean,
        at,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[chat] POST /dm error:', {
      from: req.user?.user_id,
      to: req.body?.to_user_id,
      err,
    });
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default r;
