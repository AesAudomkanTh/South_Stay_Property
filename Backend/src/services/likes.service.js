// Backend/src/services/likes.service.js
import { pool } from '../db.js';

// นับจำนวนไลก์ของโพสต์
export async function countLikes(post_id) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS c
     FROM post_likes
     WHERE post_id = ? AND deleted_at IS NULL`,
    [post_id]
  );
  return Number(rows?.[0]?.c || 0);
}

// ผู้ใช้คนนี้กดไลก์โพสต์นี้อยู่ไหม
export async function isLiked(user_id, post_id) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM post_likes
     WHERE user_id = ? AND post_id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [user_id, post_id]
  );
  return rows.length > 0;
}

// toggle like/unlike
export async function toggleLike(user_id, post_id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // มีไลก์ที่ยังไม่ลบอยู่แล้วหรือไม่
    const [rows] = await conn.query(
      `SELECT user_id, post_id
       FROM post_likes
       WHERE user_id=? AND post_id=? AND deleted_at IS NULL
       LIMIT 1`,
      [user_id, post_id]
    );

    let liked;
    if (rows.length > 0) {
      // มีอยู่ -> ถือว่า "ยกเลิกถูกใจ" (soft delete)
      await conn.query(
        `UPDATE post_likes SET deleted_at = NOW()
         WHERE user_id=? AND post_id=? AND deleted_at IS NULL`,
        [user_id, post_id]
      );
      liked = false;
    } else {
      // ยังไม่มี -> "กดถูกใจ"
      // ใช้ INSERT ... ON DUPLICATE KEY UPDATE รองรับ primary key (user_id, post_id)
      await conn.query(
        `INSERT INTO post_likes (user_id, post_id, created_at, deleted_at)
         VALUES (?,?, NOW(), NULL)
         ON DUPLICATE KEY UPDATE deleted_at = NULL`,
        [user_id, post_id]
      );
      liked = true;
    }

    // ดึงจำนวนใหม่
    const [cntRows] = await conn.query(
      `SELECT COUNT(*) AS c
       FROM post_likes
       WHERE post_id=? AND deleted_at IS NULL`,
      [post_id]
    );
    const count = Number(cntRows?.[0]?.c || 0);

    await conn.commit();
    return { liked, count };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// รายการไอดีโพสต์ทั้งหมดที่ผู้ใช้นี้กดไลก์
export async function listMyLikes(user_id) {
  const [rows] = await pool.query(
    `SELECT post_id
     FROM post_likes
     WHERE user_id=? AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [user_id]
  );
  return rows.map(r => String(r.post_id));
}
