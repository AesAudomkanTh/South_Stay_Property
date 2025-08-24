// src/services/poster.service.js
import { pool } from '../db.js';
import crypto from 'crypto';

// สร้าง id สั้น ๆ แบบ base64url (หรือจะใช้ uuid ก็ได้)
function genId(prefix) {
  const id = crypto.randomBytes(9).toString('base64url'); // ~12 chars
  return `${prefix}_${id}`;
}

/**
 * user: มาจาก req.user ที่ decode จาก JWT
 * body: ผ่าน validate แล้วตาม CreatePosterSchema
 *
 * ตาราง posters (ตาม schema ที่คุณให้):
 * post_id (PK), user_id, remark, title, description, post_type, property_type,
 * price, status, boost_date, land_area, feasibility, latitude, longitude,
 * bed_room, bath_room, kitchen_room, expire_date, viewer, landmark_id,
 * created_at, updated_at, deleted_at
 *
 * ตาราง post_image:
 * image_id (PK), post_id (FK), name, image_url, created_at, deleted_at
 */
export async function createPosterAtomic(user, body) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const post_id = genId('post');

    // แม็พเฉพาะคอลัมน์ที่ "มีจริง" ในตาราง
    // remark, feasibility, land_area, boost_date, expire_date, landmark_id — ให้เป็น null ถ้าไม่ได้ส่ง
    // status กำหนด 'active' เป็นค่าเริ่มต้น (ตารางของคุณอนุญาต)
    const {
      title,
      description = '',
      post_type,          // 'sale' | 'rent'
      property_type,      // 'house' | 'condo' | 'land' | 'other'
      price,              // number
      bed_room,           // number
      bath_room,          // number
      kitchen_room = 0,   // number (optional)
      latitude,           // number
      longitude,          // number
      // ถ้า front ส่ง images มือเปล่า ให้ตั้งเป็น []
      images = [],
    } = body;

    // INSERT posters
    const insertPosterSql = `
      INSERT INTO posters
      (post_id, user_id, remark, title, description, post_type, property_type, price,
       status, boost_date, land_area, feasibility, latitude, longitude,
       bed_room, bath_room, kitchen_room, expire_date, viewer, landmark_id)
      VALUES
      (?,       ?,       ?,      ?,     ?,           ?,         ?,             ?,
       ?,      ?,         ?,        ?,           ?,         ?,
       ?,        ?,          ?,            ?,          ?,       ?)
    `;

    const insertPosterParams = [
      post_id,
      user?.user_id || null,  // ถ้า token ไม่มี user_id จะเป็น NULL (FK set null allowed)
      null,                   // remark
      title,
      description || '',
      post_type,
      property_type,
      price,
      'active',               // status default
      null,                   // boost_date
      null,                   // land_area
      null,                   // feasibility
      latitude,
      longitude,
      bed_room,
      bath_room,
      kitchen_room ?? 0,
      null,                   // expire_date
      0,                      // viewer default 0
      null,                   // landmark_id
    ];

    await conn.execute(insertPosterSql, insertPosterParams);

    // INSERT post_image ถ้ามี
    if (Array.isArray(images) && images.length > 0) {
      const insertImgSql = `
        INSERT INTO post_image (image_id, post_id, name, image_url)
        VALUES (?, ?, ?, ?)
      `;
      for (const img of images) {
        const image_id = genId('img');
        const name = img?.name || 'image';
        const url  = img?.image_url || '';
        if (!url) continue; // ถ้าไม่มี url ข้าม

        await conn.execute(insertImgSql, [image_id, post_id, name, url]);
      }
    }

    await conn.commit();

    return {
      ok: true,
      post_id,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function adminApprovePost(post_id, approve = true) {
  const status = approve ? 'active' : 'inactive';
  await pool.execute(
    'UPDATE posters SET status=?, updated_at=NOW() WHERE post_id=?',
    [status, post_id]
  );
  return { ok: true };
}
