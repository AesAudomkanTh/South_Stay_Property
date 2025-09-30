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

export default r; */

// backend/src/routes/auth.routes.js
/*import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { RegisterSchema, LoginSchema } from '../validators/auth.validators.js';
import { createUser, getUserWithScopesByLogin } from '../services/user.service.js';
import { verifyPassword } from '../utils/passwords.js';
import { signAccess } from '../utils/jwt.js';
import { requireAuth } from '../middlewares/auth.js';

const r = Router();

/** แปลงเวลาหมดอายุจาก env เช่น 15m, 1h, 7d -> ms */
/*function parseExpToMs(exp = '30m') {
  const m = /^(\d+)([smhd])$/i.exec(exp.trim());
  if (!m) return 15 * 60 * 1000; // ดีฟอลต์ 15 นาที
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  return n * (u === 's' ? 1000 : u === 'm' ? 60_000 : u === 'h' ? 3_600_000 : 86_400_000);
}

/** สร้าง scope objects ที่มี level และรายชื่อ scope แบบสั้นสำหรับ FE */
/*function buildScopes(raw) {
  const objs = Array.isArray(raw)
    ? raw.map((s) => {
        if (typeof s === 'string') return { scope_name: s, level: 999 };
        const name = s?.scope_name || s?.name || (typeof s === 'object' ? Object.keys(s)[0] : String(s));
        const level = s?.level ?? (typeof s === 'object' && s[name] ? Number(s[name]) : 1);
        return { scope_name: name, level: Number(level) || 1 };
      })
    : raw && typeof raw === 'object'
    ? Object.entries(raw).map(([name, level]) => ({ scope_name: name, level: Number(level) || 1 }))
    : [];

  const names = objs.map((x) => x.scope_name);
  return { objs, names };
}

// --------------------- REGISTER ---------------------
r.post('/register', validate(RegisterSchema), async (req, res) => {
  const { username, password, email, telephone, cid, first_name_th, last_name_th, title_th } = req.body;
  const out = await createUser({ username, password, email, telephone, cid, first_name_th, last_name_th, title_th });
  return res.json({ user_id: out.user_id });
});

// --------------------- LOGIN ------------------------
r.post('/login', validate(LoginSchema), async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  const u = await getUserWithScopesByLogin(usernameOrEmail);
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await verifyPassword(password, u.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  // ✅ เตรียม scopes: ทั้งแบบ object (สำหรับ JWT/RBAC) และชื่อ (สำหรับ FE)
  const { objs: scopeObjs, names: scopeNames } = buildScopes(u.scopes);

  // เซ็น JWT โดยเก็บ scopes (object พร้อม level) สำหรับ RBAC ฝั่ง server
  const token = signAccess({
    user_id: u.user_id,
    username: u.username,
    email: u.email,
    verify_status: u.verify_status,
    scopes: scopeObjs,
  });

  // ตั้ง httpOnly cookie (requireAuth รองรับอ่านจาก cookie ด้วย)
  const cookieMaxAge = parseExpToMs(process.env.JWT_ACCESS_EXPIRES || '15m');
  const secure = process.env.NODE_ENV === 'production';
  res.cookie('access_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: cookieMaxAge,
  });

  // ส่ง token + snapshot user ให้ FE เก็บลง localStorage ถ้าต้องการ
  return res.json({
    token,
    user: {
      user_id: u.user_id,
      username: u.username,
      email: u.email,
      verify_status: u.verify_status,
      scopes: scopeNames, // FE ใช้ชื่อ scope ตรง ๆ
    },
  });
});

// ---------------------- ME --------------------------
r.get('/me', requireAuth, async (req, res) => {
  // req.user มาจากการ decode JWT ใน requireAuth (รวมทั้ง scopes ที่ normalize แล้ว)
  return res.json(req.user);
});

// -------------------- LOGOUT ------------------------
r.post('/logout', (_req, res) => {
  res.clearCookie('access_token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return res.json({ ok: true });
});

export default r; */

// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { RegisterSchema, LoginSchema } from '../validators/auth.validators.js';
import { createUser, getUserWithScopesByLogin } from '../services/user.service.js';
import { verifyPassword } from '../utils/passwords.js';
import { signAccess } from '../utils/jwt.js';
import { requireAuth } from '../middlewares/auth.js';

const r = Router();

/** แปลงเวลาหมดอายุจาก env เช่น 15m, 1h, 7d -> ms */
function parseExpToMs(exp = '30m') {
  const m = /^(\d+)([smhd])$/i.exec(String(exp).trim());
  if (!m) return 15 * 60 * 1000; // ดีฟอลต์ 15 นาที
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  return n * (u === 's' ? 1000 : u === 'm' ? 60_000 : u === 'h' ? 3_600_000 : 86_400_000);
}

/** สร้าง scope objects ที่มี level และรายชื่อ scope แบบสั้นสำหรับ FE */
function buildScopes(raw) {
  const objs = Array.isArray(raw)
    ? raw.map((s) => {
        if (typeof s === 'string') return { scope_name: s, level: 999 };
        const name = s?.scope_name || s?.name || (typeof s === 'object' ? Object.keys(s)[0] : String(s));
        const level = s?.level ?? (typeof s === 'object' && name in s ? Number(s[name]) : 1);
        return { scope_name: String(name), level: Number(level) || 1 };
      })
    : raw && typeof raw === 'object'
    ? Object.entries(raw).map(([name, level]) => ({ scope_name: String(name), level: Number(level) || 1 }))
    : [];

  // ลบซ้ำโดยยึด level มากสุด
  const map = new Map();
  for (const o of objs) {
    const cur = map.get(o.scope_name);
    if (!cur || o.level > cur.level) map.set(o.scope_name, o);
  }
  const dedup = Array.from(map.values());
  const names = dedup.map((x) => x.scope_name);
  return { objs: dedup, names };
}

// --------------------- REGISTER ---------------------
r.post('/register', validate(RegisterSchema), async (req, res) => {
  const { username, password, email, telephone, cid, first_name_th, last_name_th, title_th } = req.body;
  const out = await createUser({ username, password, email, telephone, cid, first_name_th, last_name_th, title_th });
  return res.json({ user_id: out.user_id });
});

// --------------------- LOGIN ------------------------
r.post('/login', validate(LoginSchema), async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  const u = await getUserWithScopesByLogin(usernameOrEmail);
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await verifyPassword(password, u.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  // ✅ เตรียม scopes ทั้งแบบ object (สำหรับ RBAC server) และชื่อ (สำหรับ FE)
  const { objs: scopeObjs, names: scopeNames } = buildScopes(u.scopes);

  // เซ็น JWT โดยเก็บ scopes (object พร้อม level)
  const token = signAccess({
    user_id: u.user_id,
    username: u.username,
    email: u.email,
    verify_status: u.verify_status,
    scopes: scopeObjs, // server ใช้ตัวนี้ใน requireScope
  });

  // ตั้ง httpOnly cookie (optional) — ถ้าจะใช้ cookie กับ fetch ต้องตั้ง credentials: 'include' ฝั่ง FE
  const cookieMaxAge = parseExpToMs(process.env.JWT_ACCESS_EXPIRES || '15m');
  const secure = process.env.NODE_ENV === 'production';

  res.setHeader('Cache-Control', 'no-store');
  res.cookie('access_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: cookieMaxAge,
  });

  // ส่ง token + snapshot user ให้ FE; FE สามารถเก็บ token ลง localStorage และส่งเป็น Bearer ได้
  return res.json({
    token,
    expires_in: cookieMaxAge / 1000, // วินาที
    user: {
      user_id: u.user_id,
      username: u.username,
      email: u.email,
      verify_status: u.verify_status,
      scopes: scopeNames, // FE ใช้ชื่อ scope ตรง ๆ
    },
  });
});

// ---------------------- ME --------------------------
r.get('/me', requireAuth, async (req, res) => {
  // req.user มาจากการ decode JWT ใน requireAuth
  return res.json(req.user);
});

// -------------------- LOGOUT ------------------------
r.post('/logout', (_req, res) => {
  res.clearCookie('access_token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return res.json({ ok: true });
});

export default r;



