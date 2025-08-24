import { verifyAccess } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
