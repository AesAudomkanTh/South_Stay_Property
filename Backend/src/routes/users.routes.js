import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requireScope } from '../middlewares/rbac.js';
import { adminVerifyUser } from '../services/user.service.js';

const r = Router();
// เฉพาะ admin (level >= 2)
r.post('/:user_id/verify', requireAuth, requireScope('admin', 2), async (req, res) => {
  await adminVerifyUser(req.params.user_id, req.body?.status || 'verified');
  res.json({ ok: true });
});

export default r;
