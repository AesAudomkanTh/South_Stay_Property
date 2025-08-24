// src/routes/posters.routes.js
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requireVerified, requireScope } from '../middlewares/rbac.js';

// ✅ ใช้ตัวใหม่ ที่ validate จาก req.body ตรง ๆ (ไม่ใช่ { body: req.body })
import { validateBody } from '../middlewares/validateBody.js';

// ✅ สคีมาแบบ flat-object (ให้ตรงกับ validateBody)
import { CreatePosterSchemaNew } from '../validators/poster.validators.js';

import { createPosterAtomic, adminApprovePost } from '../services/poster.service.js';
import { pool } from '../db.js';

const r = Router();

// สร้างโพสต์
r.post(
  '/',
  requireAuth,
  requireVerified,
  validateBody(CreatePosterSchemaNew), // ✅ เปลี่ยนจาก validate() เดิม มาใช้ validateBody()
  async (req, res) => {
    try {
      console.log('🧩 [posters] body หลัง validate:', req.body);
      console.log('🧩 [posters] user from token:', req.user);

      const result = await createPosterAtomic(req.user, req.body);

      // แนะนำให้ backend คืน post_id/id กลับมาเสมอ เพื่อให้ FE ใช้ต่อได้
      return res.json(result);
    } catch (err) {
      console.error('💥 [posters] create error:', err);

      // ถ้าเป็น error จาก DB ช่วยเดบักให้อ่านง่าย
      if (err?.code || err?.sqlMessage) {
        return res.status(500).json({
          error: 'Internal Server Error',
          code: err.code,
          sqlMessage: err.sqlMessage,
        });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// อนุมัติโพสต์ (สำหรับแอดมิน)
r.post('/:post_id/approve', requireAuth, requireScope('admin', 2), async (req, res) => {
  await adminApprovePost(req.params.post_id, req.body?.approve !== false);
  res.json({ ok: true });
});

// รายการโพสต์ public
r.get('/', async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT p.*, u.username
       FROM posters p
  LEFT JOIN users u ON u.user_id = p.user_id
      WHERE p.deleted_at IS NULL
        AND p.status = 'active'
   ORDER BY p.created_at DESC
      LIMIT 50`
  );
  res.json(rows);
});

export default r;
