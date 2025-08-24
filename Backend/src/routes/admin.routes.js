/*import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';
import { requireScope } from '../middlewares/rbac.js';

const r = Router();

// ต้องเป็น admin level >=2
const needAdmin = [requireAuth, requireScope('admin', 2)];

// ===== USERS =====
r.get('/users', needAdmin, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT
       u.user_id, u.username, u.email, u.verify_status,
       GROUP_CONCAT(s.scope_name ORDER BY s.scope_name) AS scopes,
       MAX(us.level) AS max_level,
       u.created_at
     FROM users u
     LEFT JOIN user_scopes us ON us.user_id=u.user_id AND us.deleted_at IS NULL
     LEFT JOIN scopes s ON s.scope_id=us.scope_id
     WHERE u.deleted_at IS NULL
     GROUP BY u.user_id
     ORDER BY u.created_at DESC`
  );
  res.json(rows.map(r => ({
    id: r.user_id,
    name: r.username,
    email: r.email,
    role: (r.scopes || '').includes('admin') ? 'admin' : 'member',
    status: r.verify_status === 'verified' ? 'active' :
            r.verify_status === 'pending'  ? 'pending' : r.verify_status || 'pending',
    createdAt: r.created_at,
  })));
});

// verify / unverify user
r.patch('/users/:user_id/verify', needAdmin, async (req, res) => {
  const status = req.body?.status === 'verified' ? 'verified' : 'pending';
  await pool.execute(
    `UPDATE users SET verify_status=?, updated_at=NOW() WHERE user_id=?`,
    [status, req.params.user_id]
  );
  res.json({ ok: true, status });
});

// ปรับ role อย่างง่าย: member|admin
r.patch('/users/:user_id', needAdmin, async (req, res) => {
  const role = req.body?.role === 'admin' ? 'admin' : 'member';

  // หา scope admin
  const [[adm]] = await pool.execute(
    `SELECT scope_id FROM scopes WHERE scope_name='admin' LIMIT 1`
  );
  if (!adm) return res.status(500).json({ error: 'admin scope not found' });

  if (role === 'admin') {
    // upsert admin scope level 3
    await pool.execute(
      `INSERT INTO user_scopes (user_sc_id, user_id, scope_id, level, created_at, updated_at)
       VALUES (REPLACE(UUID(),'-',''), ?, ?, 3, NOW(), NOW())
       ON DUPLICATE KEY UPDATE level=VALUES(level), updated_at=NOW(), deleted_at=NULL`,
      [req.params.user_id, adm.scope_id]
    );
  } else {
    // unassign: set deleted_at
    await pool.execute(
      `UPDATE user_scopes SET deleted_at=NOW()
       WHERE user_id=? AND scope_id=? AND deleted_at IS NULL`,
      [req.params.user_id, adm.scope_id]
    );
  }
  res.json({ ok: true, role });
});

// (ออปชัน) ลบผู้ใช้แบบ soft-delete
r.delete('/users/:user_id', needAdmin, async (req, res) => {
  await pool.execute(
    `UPDATE users SET deleted_at=NOW() WHERE user_id=?`,
    [req.params.user_id]
  );
  res.json({ ok: true });
});

// ===== POSTS =====
r.get('/posts', needAdmin, async (req, res) => {
  // แอดมินต้องเห็นทุกสถานะ
  const [rows] = await pool.execute(
    `SELECT p.post_id, p.title, p.status, p.price, p.created_at, u.username AS author
     FROM posters p
     LEFT JOIN users u ON u.user_id=p.user_id
     WHERE p.deleted_at IS NULL
     ORDER BY p.created_at DESC`
  );
  res.json(rows.map(r => ({
    id: r.post_id,
    title: r.title,
    author: r.author || '-',
    status: r.status,                 // 'pending'|'published'|'rejected'
    price: Number(r.price || 0),
    createdAt: r.created_at
  })));
});

// อนุมัติโพสต์
r.patch('/posts/:post_id/approve', needAdmin, async (req, res) => {
  const approve = req.body?.approve !== false; // default true
  await pool.execute(
    `UPDATE posters
     SET status=?, updated_at=NOW()
     WHERE post_id=?`,
    [approve ? 'active' : 'rejected', req.params.post_id]
  );
  res.json({ ok: true, status: approve ? 'active' : 'rejected' });
});

// ลบโพสต์แบบ soft-delete
r.delete('/posts/:post_id', needAdmin, async (req, res) => {
  await pool.execute(
    `UPDATE posters SET deleted_at=NOW() WHERE post_id=?`,
    [req.params.post_id]
  );
  res.json({ ok: true });
});

export default r;*/

// src/routes/admin.routes.js
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';
import { requireScope } from '../middlewares/rbac.js';

const r = Router();

// ต้องเป็น admin level >=2
const needAdmin = [requireAuth, requireScope('admin', 2)];

// ===== USERS =====
r.get('/users', needAdmin, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT
       u.user_id, u.username, u.email, u.verify_status,
       GROUP_CONCAT(s.scope_name ORDER BY s.scope_name) AS scopes,
       MAX(us.level) AS max_level,
       u.created_at
     FROM users u
     LEFT JOIN user_scopes us 
       ON us.user_id=u.user_id AND us.deleted_at IS NULL
     LEFT JOIN scopes s 
       ON s.scope_id=us.scope_id
     WHERE u.deleted_at IS NULL
     GROUP BY u.user_id
     ORDER BY u.created_at DESC`
  );

  res.json(
    rows.map(r => ({
      id: r.user_id,
      name: r.username,
      email: r.email,
      role: (r.scopes || '').includes('admin') ? 'admin' : 'member',
      status:
        r.verify_status === 'verified'
          ? 'active'
          : r.verify_status === 'pending'
          ? 'pending'
          : r.verify_status || 'pending',
      createdAt: r.created_at,
    }))
  );
});

// verify / unverify user
r.patch('/users/:user_id/verify', needAdmin, async (req, res) => {
  const status = req.body?.status === 'verified' ? 'verified' : 'pending';
  await pool.execute(
    `UPDATE users 
     SET verify_status=?, updated_at=NOW() 
     WHERE user_id=? AND deleted_at IS NULL`,
    [status, req.params.user_id]
  );
  res.json({ ok: true, status });
});

// ปรับ role: member | admin
r.patch('/users/:user_id', needAdmin, async (req, res) => {
  const role = req.body?.role === 'admin' ? 'admin' : 'member';

  // หา scope admin
  const [[adm]] = await pool.execute(
    `SELECT scope_id FROM scopes WHERE scope_name='admin' LIMIT 1`
  );
  if (!adm) return res.status(500).json({ error: 'admin scope not found' });

  if (role === 'admin') {
    // upsert admin scope level 3
    await pool.execute(
      `INSERT INTO user_scopes (user_sc_id, user_id, scope_id, level, created_at, updated_at, deleted_at)
       VALUES (REPLACE(UUID(),'-',''), ?, ?, 3, NOW(), NOW(), NULL)
       ON DUPLICATE KEY UPDATE 
         level=VALUES(level), 
         updated_at=NOW(), 
         deleted_at=NULL`,
      [req.params.user_id, adm.scope_id]
    );
  } else {
    // unassign: soft delete
    await pool.execute(
      `UPDATE user_scopes 
       SET deleted_at=NOW(), updated_at=NOW()
       WHERE user_id=? AND scope_id=? AND deleted_at IS NULL`,
      [req.params.user_id, adm.scope_id]
    );
  }
  res.json({ ok: true, role });
});

// soft delete ผู้ใช้
r.delete('/users/:user_id', needAdmin, async (req, res) => {
  await pool.execute(
    `UPDATE users 
     SET deleted_at=NOW(), updated_at=NOW() 
     WHERE user_id=?`,
    [req.params.user_id]
  );
  res.json({ ok: true });
});

// ===== POSTS =====
r.get('/posts', needAdmin, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT p.post_id, p.title, p.status, p.price, p.created_at, u.username AS author
     FROM posters p
     LEFT JOIN users u ON u.user_id=p.user_id
     WHERE p.deleted_at IS NULL
     ORDER BY p.created_at DESC`
  );

  res.json(
    rows.map(r => ({
      id: r.post_id,
      title: r.title,
      author: r.author || '-',
      status: r.status, // 'pending' | 'active' | 'rejected'
      price: Number(r.price || 0),
      createdAt: r.created_at,
    }))
  );
});

// อนุมัติโพสต์
r.patch('/posts/:post_id/approve', needAdmin, async (req, res) => {
  const approve = req.body?.approve !== false; // default true
  const newStatus = approve ? 'active' : 'rejected';

  await pool.execute(
    `UPDATE posters
     SET status=?, updated_at=NOW()
     WHERE post_id=? AND deleted_at IS NULL`,
    [newStatus, req.params.post_id]
  );

  res.json({ ok: true, status: newStatus });
});

// soft delete โพสต์
r.delete('/posts/:post_id', needAdmin, async (req, res) => {
  await pool.execute(
    `UPDATE posters 
     SET deleted_at=NOW(), updated_at=NOW() 
     WHERE post_id=?`,
    [req.params.post_id]
  );
  res.json({ ok: true });
});

// alias POST -> PATCH verify user
r.post('/users/:user_id/verify', needAdmin, async (req, res) => {
  const status = req.body?.status === 'verified' ? 'verified' : 'pending';
  await pool.execute(
    `UPDATE users SET verify_status=?, updated_at=NOW() WHERE user_id=? AND deleted_at IS NULL`,
    [status, req.params.user_id]
  );
  res.json({ ok: true, status });
});


export default r;

