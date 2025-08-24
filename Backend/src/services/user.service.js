// src/services/user.service.js
import { pool, withTx } from '../db.js';
import { genId } from '../utils/id.js';
import { hashPassword, hashCid } from '../utils/passwords.js';
import { one } from '../utils/sql.js';

/**
 * ✅ helper: ดึงรายชื่อสิทธิ์ (array ของ string) + รายละเอียดสิทธิ์ (array ของ { name, level })
 */
async function getScopesForUser(user_id) {
  const [rows] = await pool.execute(
    `SELECT s.scope_name, us.level
     FROM user_scopes us
     JOIN scopes s ON s.scope_id = us.scope_id
     WHERE us.user_id = ? AND us.deleted_at IS NULL`,
    [user_id]
  );

  const scope_details = rows.map(r => ({ name: r.scope_name, level: r.level }));
  const scopes = scope_details.map(s => s.name);
  return { scopes, scope_details };
}

/**
 * ✅ helper: คืน scope_id ของชื่อ scope (สร้างให้ถ้ายังไม่มี)
 */
async function ensureScope(scope_name, conn = pool) {
  const [has] = await conn.execute(
    `SELECT scope_id FROM scopes WHERE scope_name = ? LIMIT 1`,
    [scope_name]
  );
  if (has.length) return has[0].scope_id;

  const scope_id = genId('scp');
  await conn.execute(
    `INSERT INTO scopes (scope_id, scope_name) VALUES (?, ?)`,
    [scope_id, scope_name]
  );
  return scope_id;
}

/**
 * ✅ helper: ใส่/อัปเดตสิทธิ์ให้ user (ต้องมี unique key (user_id, scope_id))
 * - ถ้ายังไม่มี unique key แนะนำให้เพิ่ม:
 *   ALTER TABLE user_scopes ADD UNIQUE KEY uniq_user_scope (user_id, scope_id);
 */
export async function upsertUserScope(user_id, scope_name, level = 1) {
  // ใช้ trx เพื่อความปลอดภัย
  return withTx(async (conn) => {
    const scope_id = await ensureScope(scope_name, conn);
    // พยายาม insert ก่อน ถ้าชนให้ update ให้ active และ set level
    await conn.execute(
      `INSERT INTO user_scopes (user_sc_id, user_id, scope_id, level, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, NOW(), NOW(), NULL)
       ON DUPLICATE KEY UPDATE level = VALUES(level), updated_at = NOW(), deleted_at = NULL`,
      [genId('uscp'), user_id, scope_id, level]
    );
  });
}

/**
 * ✅ เดิม: สร้างผู้ใช้ใหม่ + ผูก scope "customer"
 *    (ยังคง logic เดิม เพื่อไม่ให้กระทบจุดอื่น)
 */
export async function createUser({ username, password, email, telephone, cid, first_name_th, last_name_th, title_th }) {
  const user_id = genId('usr');
  const pwd = await hashPassword(password);
  const cid_hash = await hashCid(cid, process.env.CID_PEPPER);

  await withTx(async (conn) => {
    await conn.execute(
      `INSERT INTO users (user_id, username, password, email, telephone, cid_hash, first_name_th, last_name_th, title_th, verify_status)
       VALUES (?,?,?,?,?,?,?,?,?, 'pending')`,
      [user_id, username, pwd, email, telephone || null, cid_hash, first_name_th || null, last_name_th || null, title_th || null]
    );

    // เดิม: เตรียม scope "customer"
    const scope_id = await ensureScope('customer', conn);

    await conn.execute(
      `INSERT INTO user_scopes (user_sc_id, user_id, scope_id, level)
       VALUES (?,?,?,?)`,
      [genId('uscp'), user_id, scope_id, 1]
    );

    // สร้าง wallet เริ่มต้น
    await conn.execute(
      `INSERT INTO wallets (wallet_id, user_id, balance) VALUES (?,?,0.00)`,
      [genId('wal'), user_id]
    );
  });

  return { user_id };
}

/**
 * ✅ ปรับนิดเดียว: คืน "scopes" เป็น array ของ string (เช่น ["admin","customer"])
 *    และเพิ่ม "scope_details" เก็บทั้งชื่อ+ระดับไว้เผื่อใช้ต่อ (ไม่กระทบผู้ใช้เดิม)
 */
export async function getUserWithScopesByLogin(usernameOrEmail) {
  const [rows] = await pool.execute(
    `SELECT u.user_id, u.username, u.password, u.verify_status, u.email
     FROM users u
     WHERE u.username = ? OR u.email = ?
     LIMIT 1`,
    [usernameOrEmail, usernameOrEmail]
  );
  const user = one(rows);
  if (!user) return null;

  const { scopes, scope_details } = await getScopesForUser(user.user_id);

  // คืน scopes เป็น array ของ string เพื่อให้ JWT/FE ใช้ง่าย
  return { ...user, scopes, scope_details };
}

/**
 * ✅ เพิ่ม: ดึงผู้ใช้ตาม user_id และแนบ scopes
 */
export async function getUserById(user_id) {
  const [rows] = await pool.execute(
    `SELECT u.user_id, u.username, u.verify_status, u.email,
            u.first_name_th, u.last_name_th, u.title_th, u.telephone
     FROM users u
     WHERE u.user_id = ?
     LIMIT 1`,
    [user_id]
  );
  const user = one(rows);
  if (!user) return null;

  const { scopes, scope_details } = await getScopesForUser(user_id);
  return { ...user, scopes, scope_details };
}

/**
 * ✅ เพิ่ม: รายชื่อผู้ใช้ทั้งหมด (สำหรับหน้าแอดมิน)
 *    - แนบ scopes (array ของ string) ให้ทุกคน
 */
export async function listUsersWithScopes() {
  const [rows] = await pool.execute(
    `SELECT u.user_id, u.username, u.email, u.verify_status,
            u.first_name_th, u.last_name_th, u.title_th, u.telephone,
            u.created_at
     FROM users u
     ORDER BY u.created_at DESC`
  );

  // เติม scopes ให้ทีละคน (ถ้ากังวลเรื่องประสิทธิภาพ: ทำ JOIN แบบ GROUP_CONCAT ก็ได้)
  const out = [];
  for (const u of rows) {
    const { scopes } = await getScopesForUser(u.user_id);
    out.push({ ...u, scopes });
  }
  return out;
}

/**
 * ✅ เดิม: แอดมินปรับสถานะ verify ผู้ใช้
 */
export async function adminVerifyUser(user_id, status = 'verified') {
  await pool.execute(
    `UPDATE users SET verify_status = ?, updated_at = NOW() WHERE user_id = ?`,
    [status, user_id]
  );
  return true;
}
