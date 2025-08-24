// src/routes/post_images.routes.js
import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

// ตั้งค่า multer เก็บไฟล์ลง /uploads
const storage = multer.diskStorage({
  destination: function (_, __, cb) {
    cb(null, path.resolve('uploads'));
  },
  filename: function (_, file, cb) {
    const id = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname || '');
    cb(null, `img_${id}${ext || '.jpg'}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

const r = Router();

// util สร้าง image_id สั้น ๆ
function genId(prefix = 'img') {
  return `${prefix}_${crypto.randomBytes(9).toString('base64url')}`;
}

// ✅ แบบที่ 1: /api/posters/:post_id/images
r.post(
  '/posters/:post_id/images',
  requireAuth,
  upload.array('images', 20),
  async (req, res) => {
    const { post_id } = req.params;
    const files = req.files || [];

    console.log('🖼️  [/posters/:post_id/images] post_id=', post_id, ' files=', files.map(f => f.filename));

    if (!post_id) return res.status(400).json({ error: 'post_id is required' });
    if (!files.length) return res.status(400).json({ error: 'no files uploaded' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // ตรวจว่ามีโพสต์นี้อยู่จริง (optional แต่ช่วยกันพลาด)
      const [rows] = await conn.execute('SELECT post_id FROM posters WHERE post_id=? AND deleted_at IS NULL', [post_id]);
      if (!rows.length) {
        await conn.rollback();
        return res.status(404).json({ error: 'Post not found' });
      }

      const sql = `INSERT INTO post_image (image_id, post_id, name, image_url)
                   VALUES (?, ?, ?, ?)`;
      for (const file of files) {
        const image_id = genId('img');
        const image_url = `/uploads/${file.filename}`; // เปิดได้ผ่าน http://localhost:5000/uploads/<filename>
        const name = file.originalname || file.filename;
        await conn.execute(sql, [image_id, post_id, name, image_url]);
      }

      await conn.commit();
      return res.json({ ok: true, count: files.length });
    } catch (err) {
      await conn.rollback();
      console.error('💥 [/posters/:post_id/images] error:', err);
      return res.status(500).json({ error: 'Internal Server Error', code: err.code, sqlMessage: err.sqlMessage });
    } finally {
      conn.release();
    }
  }
);

// ✅ แบบที่ 2: /api/post-images (fallback) ต้องส่ง post_id ใน form-data ด้วย
r.post(
  '/post-images',
  requireAuth,
  upload.array('images', 20),
  async (req, res) => {
    const post_id = req.body?.post_id;
    const files = req.files || [];

    console.log('🖼️  [/post-images] post_id=', post_id, ' files=', files.map(f => f.filename));

    if (!post_id) return res.status(400).json({ error: 'post_id is required' });
    if (!files.length) return res.status(400).json({ error: 'no files uploaded' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute('SELECT post_id FROM posters WHERE post_id=? AND deleted_at IS NULL', [post_id]);
      if (!rows.length) {
        await conn.rollback();
        return res.status(404).json({ error: 'Post not found' });
      }

      const sql = `INSERT INTO post_image (image_id, post_id, name, image_url)
                   VALUES (?, ?, ?, ?)`;
      for (const file of files) {
        const image_id = genId('img');
        const image_url = `/uploads/${file.filename}`;
        const name = file.originalname || file.filename;
        await conn.execute(sql, [image_id, post_id, name, image_url]);
      }

      await conn.commit();
      return res.json({ ok: true, count: files.length });
    } catch (err) {
      await conn.rollback();
      console.error('💥 [/post-images] error:', err);
      return res.status(500).json({ error: 'Internal Server Error', code: err.code, sqlMessage: err.sqlMessage });
    } finally {
      conn.release();
    }
  }
);

export default r;
