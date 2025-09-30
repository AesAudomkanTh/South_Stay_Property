import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validateBody.js';
import {
  CreatePosterSchemaNew,
  UpdatePosterSchemaNew,
  normalizeImages,
} from '../validators/poster.validators.js';
import {
  createPosterAtomic,
  updatePosterByOwnerAtomic,
} from '../services/poster.service.js';
import { pool } from '../db.js';

const r = Router();

// ---------- helpers ----------
function baseUrl(req) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
}
function abs(req, url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${baseUrl(req)}${url.startsWith('/') ? '' : '/'}${url}`;
}
async function getImages(req, post_id) {
  const [imgs] = await pool.execute(
    `SELECT COALESCE(secure_url, image_url) AS url
       FROM post_image
      WHERE post_id = ? AND deleted_at IS NULL
      ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
    [post_id]
  );
  return imgs.map(x => abs(req, x.url)).filter(Boolean);
}

/* ========== Create poster ========== */
r.post(
  '/',
  requireAuth,
  validateBody(CreatePosterSchemaNew),
  async (req, res) => {
    try {
      const uid = req.user?.user_id;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const body = req.validatedBody || req.body;
      const images = normalizeImages(body.images);

      const result = await createPosterAtomic({ ...body, images }, uid);
      return res.status(201).json(result);
    } catch (err) {
      console.error('[POST /api/posters] error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/* ========== Update poster by owner ========== */
r.put(
  '/:post_id',
  requireAuth,
  validateBody(UpdatePosterSchemaNew),
  async (req, res) => {
    try {
      const uid = req.user?.user_id;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const { post_id } = req.params;
      const body = req.validatedBody || req.body;

      const images = Array.isArray(body.images) ? normalizeImages(body.images) : undefined;
      const result = await updatePosterByOwnerAtomic(post_id, uid, body, images);
      if (!result.ok && result.error === 'Forbidden') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return res.json(result);
    } catch (err) {
      console.error('[PUT /api/posters/:post_id] error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/* ========== โพสต์ของฉัน ========== */
r.get('/mine', requireAuth, async (req, res) => {
  try {
    const uid = req.user?.user_id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const [rows] = await pool.execute(
      `SELECT p.post_id, p.user_id, p.title, p.description,
              p.post_type, p.property_type, p.price, p.status,
              p.latitude, p.longitude,
              p.land_area, p.feasibility,
              p.project, p.address, p.province, p.floor, p.parking,
              p.bed_room, p.bath_room, p.kitchen_room,
              p.created_at, p.updated_at
         FROM posters p
        WHERE p.deleted_at IS NULL
          AND p.user_id = ?
        ORDER BY p.created_at DESC
        LIMIT 200`,
      [uid]
    );

    const withImages = await Promise.all(
      rows.map(async (row) => ({ ...row, images: await getImages(req, row.post_id) }))
    );

    res.json(withImages);
  } catch (err) {
    console.error('[posters/mine] error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/* ========== รายการ public (status) ========== */
r.get('/', async (req, res) => {
  const status = req.query.status || 'active';

  const [rows] = await pool.execute(
    `SELECT 
        p.post_id, p.user_id, p.title, p.description,
        p.post_type, p.property_type, p.price, p.status,
        p.latitude, p.longitude,
        p.land_area, p.feasibility,
        p.project, p.address, p.province, p.floor, p.parking,
        p.bed_room, p.bath_room, p.kitchen_room,
        p.created_at, p.updated_at,
        u.username, u.created_at AS user_created_at
     FROM posters p
     LEFT JOIN users u ON u.user_id = p.user_id
     WHERE p.deleted_at IS NULL
       AND p.status = ?
     ORDER BY p.created_at DESC
     LIMIT 50`,
    [status]
  );

  const withImages = await Promise.all(
    rows.map(async (row) => ({ ...row, images: await getImages(req, row.post_id) }))
  );

  res.json(withImages);
});

/* ========== รายละเอียด public ========== */
r.get('/:post_id', async (req, res) => {
  const { post_id } = req.params;

  const [[post]] = await pool.execute(
    `SELECT 
        p.post_id, p.user_id, p.title, p.description,
        p.post_type, p.property_type, p.price, p.status,
        p.latitude, p.longitude,
        p.land_area, p.feasibility,
        p.project, p.address, p.province, p.floor, p.parking,
        p.bed_room, p.bath_room, p.kitchen_room,
        p.created_at, p.updated_at,
        u.username, u.created_at AS user_created_at
     FROM posters p
     LEFT JOIN users u ON u.user_id = p.user_id
     WHERE p.deleted_at IS NULL
       AND p.post_id = ?
     LIMIT 1`,
    [post_id]
  );
  if (!post) return res.status(404).json({ error: 'Not Found' });

  const [images] = await pool.execute(
    `SELECT 
        image_id, 
        name, 
        COALESCE(secure_url, image_url) AS image_url,
        public_id, format, resource_type, width, height, bytes, is_primary, sort_order
       FROM post_image
      WHERE post_id = ? AND deleted_at IS NULL
      ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
    [post_id]
  );

  post.images = images.map(img => ({ ...img, image_url: abs(req, img.image_url) }));
  post.area = post.land_area ?? null;

  res.json(post);
});

export default r;
