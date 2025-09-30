import crypto from 'crypto';
import { pool } from '../db.js';

/** gen id สั้น */
function genId(prefix = 'post') {
  return `${prefix}_${crypto.randomBytes(6).toString('base64url')}`;
}

/** สร้างโพสต์ + รูปภาพ (ทรานแซกชัน) */
export async function createPosterAtomic(payload, user_id) {
  const post_id = genId('post');

  const {
    title, description, post_type, property_type, price,
    bed_room, bath_room, kitchen_room,
    latitude, longitude,
    project, address, province, floor, parking, land_area, feasibility,
    images = [],
  } = payload;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ ใส่ค่า location = ST_SRID(POINT(lon, lat), 4326)
    await conn.execute(
      `INSERT INTO posters (
        post_id, user_id, title, description,
        post_type, property_type, price,
        latitude, longitude, location,
        bed_room, bath_room, kitchen_room,
        project, address, province, floor, parking, land_area, feasibility,
        status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ST_SRID(POINT(?, ?), 4326),
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        'pending', NOW(), NOW()
      )`,
      [
        post_id, user_id, title, description,
        post_type, property_type, price,
        latitude, longitude, longitude, latitude,          // <- ค่าใน POINT(X=lon, Y=lat)
        bed_room ?? 0, bath_room ?? 0, kitchen_room ?? 0,
        project || null, address || null, province || null,
        floor ?? null, parking ?? null, land_area ?? null, feasibility || null,
      ],
    );

    // insert images
    const imgSql = `INSERT INTO post_image
      (image_id, post_id, name, image_url, secure_url, is_primary, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;

    for (const [i, img] of images.entries()) {
      const image_id = genId('img');
      const name = img.name || `image_${i + 1}`;
      const url = img.image_url;
      const is_primary = img.is_primary ? 1 : (i === 0 ? 1 : 0);
      const sort_order = Number.isInteger(img.sort_order) ? img.sort_order : i;

      await conn.execute(imgSql, [
        image_id, post_id, name, url, url, is_primary, sort_order,
      ]);
    }

    await conn.commit();
    return { ok: true, post_id };
  } catch (err) {
    // เผื่อ MySQL รุ่นเก่าที่ไม่มี ST_SRID ให้ fallback ใส่ POINT เฉยๆ
    if (String(err?.sqlMessage || '').includes('FUNCTION') && String(err?.sqlMessage || '').includes('ST_SRID')) {
      try {
        await conn.rollback();
        await conn.beginTransaction();
        await conn.execute(
          `INSERT INTO posters (
            post_id, user_id, title, description,
            post_type, property_type, price,
            latitude, longitude, location,
            bed_room, bath_room, kitchen_room,
            project, address, province, floor, parking, land_area, feasibility,
            status, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, POINT(?, ?),
            ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            'pending', NOW(), NOW()
          )`,
          [
            post_id, user_id, title, description,
            post_type, property_type, price,
            latitude, longitude, longitude, latitude,
            bed_room ?? 0, bath_room ?? 0, kitchen_room ?? 0,
            project || null, address || null, province || null,
            floor ?? null, parking ?? null, land_area ?? null, feasibility || null,
          ],
        );

        const imgSql = `INSERT INTO post_image
          (image_id, post_id, name, image_url, secure_url, is_primary, sort_order, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
        for (const [i, img] of images.entries()) {
          const image_id = genId('img');
          const name = img.name || `image_${i + 1}`;
          const url = img.image_url;
          const is_primary = img.is_primary ? 1 : (i === 0 ? 1 : 0);
          const sort_order = Number.isInteger(img.sort_order) ? img.sort_order : i;

          await conn.execute(imgSql, [
            image_id, post_id, name, url, url, is_primary, sort_order,
          ]);
        }

        await conn.commit();
        return { ok: true, post_id };
      } catch (e2) {
        await conn.rollback();
        throw e2;
      } finally {
        conn.release();
      }
    }

    await conn.rollback();
    throw err;
  } finally {
    try { conn.release(); } catch {}
  }
}

/** แก้ไขประกาศของเจ้าของเอง (แทนที่รูปทั้งหมดถ้าส่ง images มา) */
export async function updatePosterByOwnerAtomic(post_id, user_id, patch, newImages /* normalized */) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // เอาค่า lat/lng ปัจจุบันมาด้วย เพื่อคำนวณ location ที่ถูกต้อง
    const [[own]] = await conn.execute(
      `SELECT post_id, latitude AS cur_lat, longitude AS cur_lng
         FROM posters
        WHERE post_id=? AND user_id=? AND deleted_at IS NULL
        LIMIT 1`,
      [post_id, user_id],
    );
    if (!own) {
      await conn.rollback();
      return { ok: false, error: 'Forbidden' };
    }

    // เตรียม fields
    const fields = [];
    const vals = [];

    const allow = [
      'title', 'description', 'post_type', 'property_type', 'price',
      'bed_room', 'bath_room', 'kitchen_room',
      'latitude', 'longitude',
      'project', 'address', 'province', 'floor', 'parking', 'land_area', 'feasibility',
    ];
    for (const k of allow) {
      if (k in patch) {
        fields.push(`${k}=?`);
        vals.push(patch[k]);
      }
    }

    // ถ้าแก้ lat/lng อย่างน้อยหนึ่งตัว → อัปเดต location ให้สัมพันธ์กันเสมอ
    const latChanged = Object.prototype.hasOwnProperty.call(patch, 'latitude');
    const lngChanged = Object.prototype.hasOwnProperty.call(patch, 'longitude');
    if (latChanged || lngChanged) {
      const newLat = latChanged ? patch.latitude : own.cur_lat;
      const newLng = lngChanged ? patch.longitude : own.cur_lng;
      fields.push(`location = ST_SRID(POINT(?, ?), 4326)`);
      vals.push(newLng, newLat);
    }

    if (fields.length) {
      // กลับเป็น pending ให้รีวิวใหม่
      await conn.execute(
        `UPDATE posters SET ${fields.join(', ')}, status='pending', updated_at=NOW() WHERE post_id=?`,
        [...vals, post_id],
      );
    }

    // ถ้ามีภาพใหม่ → soft-delete ภาพเดิม แล้ว insert ใหม่
    if (Array.isArray(newImages) && newImages.length) {
      await conn.execute(
        `UPDATE post_image SET deleted_at = NOW() WHERE post_id=? AND deleted_at IS NULL`,
        [post_id],
      );

      const imgSql = `INSERT INTO post_image
        (image_id, post_id, name, image_url, secure_url, is_primary, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;

      for (const [i, img] of newImages.entries()) {
        const image_id = genId('img');
        const name = img.name || `image_${i + 1}`;
        const url = img.image_url;
        const is_primary = img.is_primary ? 1 : (i === 0 ? 1 : 0);
        const sort_order = Number.isInteger(img.sort_order) ? img.sort_order : i;

        await conn.execute(imgSql, [
          image_id, post_id, name, url, url, is_primary, sort_order,
        ]);
      }
    }

    await conn.commit();
    return { ok: true, post_id };
  } catch (err) {
    // fallback ให้ POINT() ถ้าไม่มี ST_SRID (กรณี MySQL เก่ามาก)
    if (String(err?.sqlMessage || '').includes('FUNCTION') && String(err?.sqlMessage || '').includes('ST_SRID')) {
      try {
        await conn.rollback();
        await conn.beginTransaction();

        const [[own]] = await conn.execute(
          `SELECT post_id, latitude AS cur_lat, longitude AS cur_lng
             FROM posters
            WHERE post_id=? AND user_id=? AND deleted_at IS NULL
            LIMIT 1`,
          [post_id, user_id],
        );
        if (!own) {
          await conn.rollback();
          return { ok: false, error: 'Forbidden' };
        }

        const fields = [];
        const vals = [];
        const allow = [
          'title', 'description', 'post_type', 'property_type', 'price',
          'bed_room', 'bath_room', 'kitchen_room',
          'latitude', 'longitude',
          'project', 'address', 'province', 'floor', 'parking', 'land_area', 'feasibility',
        ];
        for (const k of allow) {
          if (k in patch) {
            fields.push(`${k}=?`);
            vals.push(patch[k]);
          }
        }
        const latChanged = Object.prototype.hasOwnProperty.call(patch, 'latitude');
        const lngChanged = Object.prototype.hasOwnProperty.call(patch, 'longitude');
        if (latChanged || lngChanged) {
          const newLat = latChanged ? patch.latitude : own.cur_lat;
          const newLng = lngChanged ? patch.longitude : own.cur_lng;
          fields.push(`location = POINT(?, ?)`);
          vals.push(newLng, newLat);
        }
        if (fields.length) {
          await conn.execute(
            `UPDATE posters SET ${fields.join(', ')}, status='pending', updated_at=NOW() WHERE post_id=?`,
            [...vals, post_id],
          );
        }

        if (Array.isArray(newImages) && newImages.length) {
          await conn.execute(
            `UPDATE post_image SET deleted_at = NOW() WHERE post_id=? AND deleted_at IS NULL`,
            [post_id],
          );
          const imgSql = `INSERT INTO post_image
            (image_id, post_id, name, image_url, secure_url, is_primary, sort_order, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
          for (const [i, img] of newImages.entries()) {
            const image_id = genId('img');
            const name = img.name || `image_${i + 1}`;
            const url = img.image_url;
            const is_primary = img.is_primary ? 1 : (i === 0 ? 1 : 0);
            const sort_order = Number.isInteger(img.sort_order) ? img.sort_order : i;

            await conn.execute(imgSql, [
              image_id, post_id, name, url, url, is_primary, sort_order,
            ]);
          }
        }

        await conn.commit();
        return { ok: true, post_id };
      } catch (e2) {
        await conn.rollback();
        throw e2;
      } finally {
        conn.release();
      }
    }

    await conn.rollback();
    throw err;
  } finally {
    try { conn.release(); } catch {}
  }
}
