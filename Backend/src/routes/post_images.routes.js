// src/routes/post_images.routes.js
import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';
import cloudinary from '../utils/cloudinary.js';

const r = Router();

// --- ensure uploads dir exists ---
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// --- multer local storage ---
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const id = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname || '') || '.jpg';
    cb(null, `img_${id}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

// --- helpers ---
function genId(prefix = 'img') {
  return `${prefix}_${crypto.randomBytes(9).toString('base64url')}`;
}
function baseUrl(req) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
}
function abs(req, url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${baseUrl(req)}${url.startsWith('/') ? '' : '/'}${url}`;
}
function wantCloud(req) {
  const tag = (req.query?.to || req.body?.to || '').toString().toLowerCase();
  return tag === 'cloud' || tag === 'cloudinary';
}

// ---------- (1) /api/posters/:post_id/images ----------
r.post('/posters/:post_id/images', requireAuth, upload.array('images', 20), async (req, res) => {
  const { post_id } = req.params;
  const files = req.files || [];
  const urlList = Array.isArray(req.body?.image_urls) ? req.body.image_urls : [];

  if (!post_id) return res.status(400).json({ error: 'post_id is required' });
  if (!files.length && !urlList.length) return res.status(400).json({ error: 'no files uploaded' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[exists]] = await conn.execute(
      'SELECT post_id FROM posters WHERE post_id=? AND deleted_at IS NULL LIMIT 1',
      [post_id]
    );
    if (!exists) {
      await conn.rollback();
      return res.status(404).json({ error: 'Post not found' });
    }

    const sql = `INSERT INTO post_image 
      (image_id, post_id, name, image_url, secure_url, public_id, format, resource_type, width, height, bytes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    // 1A) ไฟล์ที่อัปโหลด
    for (const file of files) {
      let record = {
        name: file.originalname || file.filename,
        image_url: null,
        secure_url: null,
        public_id: null,
        format: null,
        resource_type: null,
        width: null,
        height: null,
        bytes: file.size ?? null,
      };

      if (wantCloud(req) && process.env.CLOUDINARY_CLOUD_NAME) {
        // อัปขึ้น Cloudinary
        const up = await cloudinary.uploader.upload(file.path, {
          folder: `southstay/${post_id}`,
          resource_type: 'image',
        });
        record.secure_url = up.secure_url;
        record.public_id = up.public_id;
        record.format = up.format;
        record.resource_type = up.resource_type;
        record.width = up.width;
        record.height = up.height;
        record.bytes = up.bytes ?? record.bytes;
        record.image_url = up.secure_url; // ให้ image_url เป็น url ที่โหลดได้เช่นกัน

        // ลบไฟล์ชั่วคราวออกเพื่อลดพื้นที่
        try { fs.unlinkSync(file.path); } catch {}
      } else {
        // เก็บไฟล์บนเครื่อง
        const rel = `/uploads/${file.filename}`;
        record.image_url = abs(req, rel);
      }

      await conn.execute(sql, [
        genId('img'),
        post_id,
        record.name,
        record.image_url,
        record.secure_url,
        record.public_id,
        record.format,
        record.resource_type,
        record.width,
        record.height,
        record.bytes,
      ]);
    }

    // 1B) แนบด้วย URL ตรง (เช่น Cloudinary URL จาก FE)
    for (const raw of urlList) {
      const url = abs(req, raw);
      await conn.execute(sql, [
        genId('img'),
        post_id,
        null,
        url,                  // image_url
        /^https?:\/\//.test(url) ? url : null, // ถ้าเป็น http ให้ใส่เป็น secure_url ด้วยก็ได้
        null, null, null, null, null, null,
      ]);
    }

    await conn.commit();
    return res.json({ ok: true, count: files.length + urlList.length });
  } catch (err) {
    await conn.rollback();
    console.error('💥 [/posters/:post_id/images] error:', err);
    return res.status(500).json({ error: 'Internal Server Error', code: err.code, sqlMessage: err.sqlMessage });
  } finally {
    conn.release();
  }
});

// ---------- (2) /api/post-images (fallback ต้องมี post_id) ----------
r.post('/post-images', requireAuth, upload.array('images', 20), async (req, res) => {
  req.params.post_id = req.body?.post_id; // reuse handler เหนือได้ แต่เขียนแยกไว้ชัดๆ
  return r.handle(req, res); // ให้ Express reuse middleware chain ด้านบน
});

export default r;
