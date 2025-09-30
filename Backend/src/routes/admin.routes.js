// src/routes/admin.routes.js
import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireScope } from "../middlewares/rbac.js";

const r = Router();

// ต้องเป็น admin เท่านั้น
r.use(requireAuth, requireScope("admin", 1));

/* ---------------------------- helpers ---------------------------- */

function normalizeUserVerifyStatus(s) {
  // FE บางที่ส่ง active/rejected มา แต่ตาราง users มี enum: verified|pending|unverified
  if (!s) return null;
  const x = String(s).toLowerCase();
  if (x === "active" || x === "verified") return "verified";
  if (x === "rejected" || x === "unverify" || x === "unverified") return "unverified";
  if (x === "pending") return "pending";
  // ค่าที่ไม่รู้จัก -> ไม่อัปเดต
  return null;
}

function normalizePostStatus(s) {
  if (!s) return null;
  const x = String(s).toLowerCase();
  if (x === "published") return "active"; // FE อาจส่ง published
  const allow = ["pending", "active", "rejected", "inactive", "sold"];
  return allow.includes(x) ? x : null;
}

/* =============================== USERS =============================== */

// GET /api/admin/users
// (ไม่มีคอลัมน์ role ในตารางจริง ๆ จึง alias เป็น 'member' ให้ FE ใช้ได้)
r.get("/users", async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT user_id,
              username,
              email,
              verify_status,
              created_at,
              'member' AS role
         FROM users
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 200`
    );
    return res.json(
      rows.map((u) => ({
        ...u,
        verify_status: u.verify_status ?? "pending",
      }))
    );
  } catch (e) {
    console.error("💥 [/api/admin/users] error:", e);
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: e.code, sqlMessage: e.sqlMessage });
  }
});

// PATCH /api/admin/users/:id/verify
r.patch("/users/:id/verify", async (req, res) => {
  const id = req.params.id;
  const status = normalizeUserVerifyStatus(req.body?.status || "verified");
  if (!status) return res.status(400).json({ error: "Bad status value" });

  try {
    await pool.execute(
      `UPDATE users
          SET verify_status = ?, updated_at = NOW()
        WHERE user_id = ? AND deleted_at IS NULL`,
      [status, id]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("💥 [/api/admin/users/:id/verify] error:", e);
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: e.code, sqlMessage: e.sqlMessage });
  }
});

// PATCH /api/admin/users/:id
r.patch("/users/:id", async (req, res) => {
  const id = req.params.id;
  const { name, email, verify_status, status } = req.body || {};
  const newStatus = normalizeUserVerifyStatus(verify_status ?? status);

  try {
    // อัปเดต field พื้นฐาน (ตารางจริงใช้ username แทน name และไม่มี role)
    await pool.execute(
      `UPDATE users
          SET username = COALESCE(?, username),
              email    = COALESCE(?, email),
              updated_at = NOW()
        WHERE user_id = ? AND deleted_at IS NULL`,
      [name ?? null, email ?? null, id]
    );

    if (newStatus) {
      await pool.execute(
        `UPDATE users
            SET verify_status = ?, updated_at = NOW()
          WHERE user_id = ? AND deleted_at IS NULL`,
        [newStatus, id]
      );
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("💥 [/api/admin/users/:id] error:", e);
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: e.code, sqlMessage: e.sqlMessage });
  }
});

// DELETE /api/admin/users/:id (soft delete)
r.delete("/users/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await pool.execute(
      `UPDATE users
          SET deleted_at = NOW(), updated_at = NOW()
        WHERE user_id = ? AND deleted_at IS NULL`,
      [id]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("💥 [/api/admin/users/:id] delete error:", e);
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: e.code, sqlMessage: e.sqlMessage });
  }
});

/* =============================== POSTS =============================== */

// helper: ดึงโพสต์ตามสถานะ
async function selectPosts(status) {
  const [rows] = await pool.execute(
    `SELECT
        p.post_id,
        p.title,
        p.price,
        p.status,
        p.created_at,
        u.username
      FROM posters p
      LEFT JOIN users u ON u.user_id = p.user_id
     WHERE p.deleted_at IS NULL AND p.status = ?
     ORDER BY p.created_at DESC
     LIMIT 200`,
    [status]
  );
  return rows;
}

// GET /api/admin/posts?status=pending
r.get("/posts", async (req, res) => {
  const status = normalizePostStatus(req.query?.status) || "pending";
  try {
    const rows = await selectPosts(status);
    return res.json(rows);
  } catch (e) {
    console.error("💥 [/api/admin/posts] error:", e);
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: e.code, sqlMessage: e.sqlMessage });
  }
});

// POST /api/admin/posts/:id/approve
r.post("/posts/:id/approve", async (req, res) => {
  const id = req.params.id;
  try {
    await pool.execute(
      `UPDATE posters
          SET status = 'active', updated_at = NOW()
        WHERE post_id = ? AND deleted_at IS NULL`,
      [id]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("💥 [/api/admin/posts/:id/approve] error:", e);
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: e.code, sqlMessage: e.sqlMessage });
  }
});

// POST /api/admin/posts/:id/reject
r.post("/posts/:id/reject", async (req, res) => {
  const id = req.params.id;
  try {
    await pool.execute(
      `UPDATE posters
          SET status = 'rejected', updated_at = NOW()
        WHERE post_id = ? AND deleted_at IS NULL`,
      [id]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("💥 [/api/admin/posts/:id/reject] error:", e);
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: e.code, sqlMessage: e.sqlMessage });
  }
});

// PUT /api/admin/posts/:id  (แก้ title/price/status)
r.put("/posts/:id", async (req, res) => {
  const id = req.params.id;
  const { title, price, status } = req.body || {};
  const normStatus = normalizePostStatus(status);

  try {
    await pool.execute(
      `UPDATE posters
          SET title = COALESCE(?, title),
              price = COALESCE(?, price),
              status = COALESCE(?, status),
              updated_at = NOW()
        WHERE post_id = ? AND deleted_at IS NULL`,
      [
        title ?? null,
        (price === undefined || price === null) ? null : Number(price),
        normStatus ?? null,
        id,
      ]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("💥 [/api/admin/posts/:id] update error:", e);
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: e.code, sqlMessage: e.sqlMessage });
  }
});

// DELETE /api/admin/posts/:id  (soft delete)
r.delete("/posts/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await pool.execute(
      `UPDATE posters
          SET deleted_at = NOW(), updated_at = NOW()
        WHERE post_id = ? AND deleted_at IS NULL`,
      [id]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("💥 [/api/admin/posts/:id] delete error:", e);
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: e.code, sqlMessage: e.sqlMessage });
  }
});

export default r;
