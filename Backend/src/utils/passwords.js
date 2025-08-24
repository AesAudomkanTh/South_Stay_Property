import bcrypt from 'bcrypt';
const ROUNDS = 12;
export const hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);
export const hashCid = (cid, pepper) => bcrypt.hash(`${cid}${pepper}`, ROUNDS);
