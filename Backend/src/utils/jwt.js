// src/utils/jwt.js
import jwt from 'jsonwebtoken';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'devsecret';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || process.env.JWT_ACCESS_EXPIRES_IN || '7d';

export function signAccess(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function verifyAccess(token) {
  return jwt.verify(token, ACCESS_SECRET);
}
