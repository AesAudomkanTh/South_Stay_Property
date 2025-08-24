// scripts/seed.js
import dotenv from 'dotenv';
dotenv.config();

import { pool, withTx } from '../src/db.js';
import { genId } from '../src/utils/id.js';
import { hashPassword, hashCid } from '../src/utils/passwords.js';

async function main() {
  await withTx(async (conn) => {
    // 1) Ensure scopes
    const scopeNames = ['admin', 'vendor', 'customer'];
    for (const name of scopeNames) {
      const [r] = await conn.execute(`SELECT scope_id FROM scopes WHERE scope_name=?`, [name]);
      if (!r.length) {
        await conn.execute(
          `INSERT INTO scopes (scope_id, scope_name) VALUES (?,?)`,
          [genId('scp'), name]
        );
      }
    }

    // 2) Seed admin user
    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const passwordPlain = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminCid = process.env.ADMIN_CID || '0000000000000'; // <-- mock CID (13 หลัก) ปรับได้

    const [u] = await conn.execute(
      `SELECT user_id FROM users WHERE username=? OR email=? LIMIT 1`,
      [username, email]
    );

    let admin_id;
    if (!u.length) {
      const pwd = await hashPassword(passwordPlain);
      const cid_hash = await hashCid(adminCid, process.env.CID_PEPPER);

      admin_id = genId('usr');
      await conn.execute(
        `INSERT INTO users (
           user_id, username, password, email, verify_status, cid_hash
         ) VALUES (?,?,?,?, 'verified', ?)`,
        [admin_id, username, pwd, email, cid_hash]
      );

      // give admin scope level 3
      const [sc] = await conn.execute(`SELECT scope_id FROM scopes WHERE scope_name='admin' LIMIT 1`);
      const adminScopeId = sc[0].scope_id;
      await conn.execute(
        `INSERT INTO user_scopes (user_sc_id, user_id, scope_id, level)
         VALUES (?,?,?,?)`,
        [genId('uscp'), admin_id, adminScopeId, 3]
      );

      // create admin wallet with initial balance
      await conn.execute(
        `INSERT INTO wallets (wallet_id, user_id, balance) VALUES (?,?,?)`,
        [genId('wal'), admin_id, 10000.00]
      );
    } else {
      admin_id = u[0].user_id;

      // Ensure admin has admin scope (level >=3)
      const [scopes] = await conn.execute(
        `SELECT s.scope_name, us.level
         FROM user_scopes us JOIN scopes s ON s.scope_id=us.scope_id
         WHERE us.user_id=?`,
        [admin_id]
      );
      const hasAdmin = scopes.find(s => s.scope_name === 'admin' && s.level >= 3);
      if (!hasAdmin) {
        const [sc] = await conn.execute(`SELECT scope_id FROM scopes WHERE scope_name='admin' LIMIT 1`);
        const adminScopeId = sc[0].scope_id;
        await conn.execute(
          `INSERT INTO user_scopes (user_sc_id, user_id, scope_id, level)
           VALUES (?,?,?,?)`,
          [genId('uscp'), admin_id, adminScopeId, 3]
        );
      }

      // Ensure wallet exists
      const [w] = await conn.execute(`SELECT wallet_id FROM wallets WHERE user_id=?`, [admin_id]);
      if (!w.length) {
        await conn.execute(
          `INSERT INTO wallets (wallet_id, user_id, balance) VALUES (?,?,?)`,
          [genId('wal'), admin_id, 10000.00]
        );
      }
    }
  });

  console.log('Seed completed.');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
