// src/routes/auth.routes.js
/*import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { RegisterSchema, LoginSchema } from '../validators/auth.validators.js';
import { createUser, getUserWithScopesByLogin } from '../services/user.service.js';
import { verifyPassword } from '../utils/passwords.js';
import { signAccess } from '../utils/jwt.js';
import { requireAuth } from '../middlewares/auth.js';

const r = Router();

// ลงทะเบียน
r.post('/register', validate(RegisterSchema), async (req, res) => {
  const { username, password, email, telephone, cid, first_name_th, last_name_th, title_th } = req.body;
  const out = await createUser({ username, password, email, telephone, cid, first_name_th, last_name_th, title_th });
  res.json({ user_id: out.user_id });
});

// ล็อกอิน
r.post('/login', validate(LoginSchema), async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  const u = await getUserWithScopesByLogin(usernameOrEmail);
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await verifyPassword(password, u.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signAccess({
    user_id: u.user_id,
    username: u.username,
    verify_status: u.verify_status,
    scopes: u.scopes,
    // เพิ่ม field ที่อยากใส่ลง token ได้ตามต้องการ เช่น email
    email: u.email,
  });

  // จะส่ง snapshot กลับไปด้วยก็ได้ (สะดวก FE)
  res.json({
    token,
    user: {
      user_id: u.user_id,
      username: u.username,
      verify_status: u.verify_status,
      scopes: u.scopes,
      email: u.email,
    }
  });
});

// /me: คืนข้อมูลที่ decode จาก JWT (ไม่เรียก DB)
r.get('/me', requireAuth, async (req, res) => {
  // req.user มาจาก requireAuth -> verifyAccess(token)
  return res.json(req.user);
});

export default r;*/

// src/routes/auth.routes.js
import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { RegisterSchema, LoginSchema } from '../validators/auth.validators.js';
import { createUser, getUserWithScopesByLogin } from '../services/user.service.js';
import { verifyPassword } from '../utils/passwords.js';
import { signAccess } from '../utils/jwt.js';
import { requireAuth } from '../middlewares/auth.js';

const r = Router();

// ลงทะเบียน
r.post('/register', validate(RegisterSchema), async (req, res) => {
  const { username, password, email, telephone, cid, first_name_th, last_name_th, title_th } = req.body;
  const out = await createUser({ username, password, email, telephone, cid, first_name_th, last_name_th, title_th });
  res.json({ user_id: out.user_id });
});

// ล็อกอิน
r.post('/login', validate(LoginSchema), async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  const u = await getUserWithScopesByLogin(usernameOrEmail);
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await verifyPassword(password, u.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  // 🔑 Normalize scopes ให้แน่ใจว่าเป็น array ของชื่อ
  const scopeNames = Array.isArray(u.scopes)
    ? u.scopes.map(s => s.scope_name || s.name || s) // รองรับได้หลายรูปแบบ
    : [];

  const token = signAccess({
    user_id: u.user_id,
    username: u.username,
    verify_status: u.verify_status,
    scopes: scopeNames,          // ✅ ใช้ array ของชื่อ scope เท่านั้น
    scopes_detail: u.scopes || [], // ✅ เก็บแบบเต็ม (ถ้ามี level) ไว้แยก field
    email: u.email,
  });

  // snapshot ส่งกลับไปให้ FE
  res.json({
    token,
    user: {
      user_id: u.user_id,
      username: u.username,
      verify_status: u.verify_status,
      scopes: scopeNames,        // ✅ FE จะได้ใช้แค่ชื่อ scope ตรง ๆ
      email: u.email,
    }
  });
});

// /me: คืนข้อมูลที่ decode จาก JWT (ไม่เรียก DB)
r.get('/me', requireAuth, async (req, res) => {
  return res.json(req.user);
});

export default r;

