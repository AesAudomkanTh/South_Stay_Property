// src/routes/booking.routes.js
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  createBooking,
  listBookedDays,
  listBookedTimesForDay,
  SLOT_MINUTES,
} from '../services/booking.service.js';

const r = Router();

/** GET: วันไหนของโพสต์นี้ถูกจองแล้วในเดือนที่ระบุ -> ใช้ทำปฏิทินไฮไลต์วัน */
r.get('/post/:post_id/month', requireAuth, async (req, res) => {
  try {
    const { post_id } = req.params;
    const year  = Number(req.query.year);
    const month = Number(req.query.month); // 1-12

    if (!post_id || !Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'INVALID_INPUT' });
    }

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end   = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    const days = await listBookedDays(
      post_id,
      start.toISOString().slice(0, 19).replace('T',' '),
      end.toISOString().slice(0, 19).replace('T',' ')
    );

    const out = days.map(d => new Date(d).toISOString().slice(0, 10)); // 'YYYY-MM-DD'
    res.json({ booked_days: out });
  } catch (err) {
    console.error('[booking] GET /post/:post_id/month error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/** GET: เวลาที่ถูกจองของวันหนึ่ง ๆ -> ใช้ disable time slot ใน UI */
r.get('/post/:post_id/day', requireAuth, async (req, res) => {
  try {
    const { post_id } = req.params;
    const date = String(req.query.date || ''); // 'YYYY-MM-DD'
    if (!post_id || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'INVALID_INPUT' });
    }
    const times = await listBookedTimesForDay(post_id, date); // ['09:00', '11:00', ...]
    res.json({ booked_times: times, slot_minutes: SLOT_MINUTES });
  } catch (err) {
    console.error('[booking] GET /post/:post_id/day error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/** POST: จองวัน+เวลาเข้าเยี่ยมชม */
r.post('/', requireAuth, async (req, res) => {
  try {
    const { post_id, date, time, to_user_id } = req.body || {};
    // date: 'YYYY-MM-DD', time: 'HH:mm'
    if (!post_id || !/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || !/^\d{2}:\d{2}$/.test(String(time || ''))) {
      return res.status(400).json({ error: 'INVALID_INPUT' });
    }

    const bk = await createBooking(req.user.user_id, post_id, date, time);

    // (ออปชัน) ส่ง DM แจ้งอีกฝั่งทันทีผ่าน Socket.IO
    const io = req.app.get('io');
    if (io && to_user_id) {
      const text = `📅 มีการจองดูทรัพย์ (โพสต์: ${post_id}) วันที่ ${date} เวลา ${time}`;
      const at = new Date().toISOString();
      io.to(`user:${to_user_id}`).emit('dm', { from: req.user.user_id, text, at });
      io.to(`user:${req.user.user_id}`).emit('dm:self', { to: to_user_id, text, at });
    }

    res.json({ ok: true, booking: bk });
  } catch (err) {
    if (err?.code === 'DATE_ALREADY_BOOKED') {
      return res.status(409).json({ error: 'DATE_ALREADY_BOOKED' });
    }
    if (err?.code === 'INVALID_INPUT') {
      return res.status(400).json({ error: 'INVALID_INPUT' });
    }
    console.error('[booking] POST / error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default r;
