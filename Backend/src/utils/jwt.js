import jwt from 'jsonwebtoken';
export const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' });
export const verifyAccess = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
