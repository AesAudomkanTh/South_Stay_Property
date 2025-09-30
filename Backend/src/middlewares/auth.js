//import { verifyAccess } from '../utils/jwt.js';

//export function requireAuth(req, res, next) {
//  const hdr = req.headers.authorization || '';
//  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
//  if (!token) return res.status(401).json({ error: 'Unauthorized' });
//  try {
//    req.user = verifyAccess(token);
//    next();
//  } catch {
//    return res.status(401).json({ error: 'Invalid token' });
//  }
//}

/*import { verifyAccess } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  let token = hdr.startsWith('Bearer ') ? hdr.slice(7).trim() : null;

  // รองรับ cookie access_token ด้วย (ถ้ามี)
  if (!token && req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', reason: 'no_token' });
  }

  try {
    const payload = verifyAccess(token); // จะ throw ถ้า invalid/expired

    // ✅ Normalize scopes ให้เป็น array ของ { scope_name, level }
    const rawScopes = payload?.scopes ?? payload?.scopes_detail ?? [];
    let normalized = [];

    if (Array.isArray(rawScopes)) {
      normalized = rawScopes
        .map((s) => {
          if (typeof s === 'string') return { scope_name: s, level: 999 };     // string = full access ของ scope นั้น
          if (s?.scope_name || s?.name) return { scope_name: s.scope_name || s.name, level: s.level ?? 1 };
          return null;
        })
        .filter(Boolean);
    } else if (rawScopes && typeof rawScopes === 'object') {
      // เผื่อเป็น object map: { admin: 1, something: 2 }
      normalized = Object.entries(rawScopes).map(([name, lvl]) => ({
        scope_name: name,
        level: Number(lvl) || 1,
      }));
    }

    // เก็บ payload + scopes ที่ normalize แล้ว
    req.user = { ...payload, scopes: normalized };

    return next();
  } catch (e) {
    const code =
      e?.name === 'TokenExpiredError' ? 'token_expired'
      : e?.name === 'JsonWebTokenError' ? 'token_invalid'
      : 'token_error';
    return res.status(401).json({ error: 'Unauthorized', code });
  }
}

export function requireVerified(req, res, next) {
  const status = req.user?.verify_status;
  // อนุญาต verified/active/1/'1'
  if (status !== 'verified' && status !== 'active' && status !== 1 && status !== '1') {
    return res.status(403).json({ error: 'Account not verified' });
  }
  next();
} */

// backend/src/middlewares/auth.js
/*import { verifyAccess } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const bearer = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  const cookieToken = req.cookies?.access_token || null;
  const token = bearer || cookieToken;

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    req.user = verifyAccess(token);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireVerified(req, res, next) {
  const status = req.user?.verify_status;
  if (status !== 'verified' && status !== 1 && status !== '1') {
    return res.status(403).json({ error: 'Account not verified' });
  }
  next();
}*/

// src/middlewares/auth.js
import { verifyAccess } from '../utils/jwt.js';

export async function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const bearer = h.replace(/^Bearer\s+/i, '');
    const cookieToken = req.cookies?.access_token;
    const token = bearer || cookieToken;
    if (!token) return res.status(401).json({ error: 'NO_TOKEN' });

    const payload = verifyAccess(token);
    if (!payload?.user_id) return res.status(401).json({ error: 'INVALID_TOKEN' });

    req.user = {
      user_id: String(payload.user_id),
      username: payload.username,
      email: payload.email,
      verify_status: payload.verify_status,
      scopes: payload.scopes, // ที่คุณเซ็นมา
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}



