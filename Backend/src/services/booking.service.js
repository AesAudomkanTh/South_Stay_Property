// src/services/booking.service.js
import { pool } from '../db.js';

// ปรับได้ผ่าน ENV: BOOKING_SLOT_MINUTES (ดีฟอลต์ 60 นาที)
export const SLOT_MINUTES = Number(process.env.BOOKING_SLOT_MINUTES || 60);

/** ดึง ‘วัน’ ที่มีการจองของโพสต์ ในช่วงเดือนที่กำหนด (ใช้ทำปฏิทินแรเงาวัน) */
export async function listBookedDays(post_id, startDate, endDate) {
  const sql = `
    SELECT DATE(book_date) AS day
    FROM book_logs
    WHERE post_id = ?
      AND deleted_at IS NULL
      AND book_date >= ?
      AND book_date < ?
    GROUP BY day
    ORDER BY day ASC
  `;
  const [rows] = await pool.query(sql, [post_id, startDate, endDate]);
  return rows.map(r => r.day); // Date|string แล้วแต่ mysql config
}

/** ดึง ‘เวลาที่ถูกจอง’ ของวันหนึ่ง ๆ (รูปแบบ HH:mm) สำหรับโพสต์ */
export async function listBookedTimesForDay(post_id, day /* 'YYYY-MM-DD' */) {
  const sql = `
    SELECT DATE_FORMAT(book_date, '%H:%i') AS hhmm
    FROM book_logs
    WHERE post_id = ?
      AND deleted_at IS NULL
      AND DATE(book_date) = DATE(?)
    ORDER BY book_date ASC
  `;
  const [rows] = await pool.query(sql, [post_id, `${day} 00:00:00`]);
  return rows.map(r => r.hhmm); // ['09:00','10:00', ...]
}

/** จองแบบระบุวัน+เวลา (สล็อตคงที่ SLOT_MINUTES) */
export async function createBooking(user_id, post_id, date /* 'YYYY-MM-DD' */, time /* 'HH:mm' */) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
    const e = new Error('INVALID_DATE'); e.code = 'INVALID_INPUT'; throw e;
  }
  if (!/^\d{2}:\d{2}$/.test(String(time || ''))) {
    const e = new Error('INVALID_TIME'); e.code = 'INVALID_INPUT'; throw e;
  }
  const start = `${date} ${time}:00`; // เก็บเป็น local DATETIME

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ล็อกโพสต์ไว้ก่อน (กันจองชนกันพร้อมกันหลายคำขอ)
    await conn.query(`SELECT post_id FROM posters WHERE post_id=? FOR UPDATE`, [post_id]);

    // ตรวจชนช่วงเวลา (overlap): existing_start < new_end && existing_end > new_start
    const [conflict] = await conn.query(
      `SELECT 1
       FROM book_logs
       WHERE post_id = ?
         AND deleted_at IS NULL
         AND book_date < DATE_ADD(?, INTERVAL ? MINUTE)
         AND DATE_ADD(book_date, INTERVAL ? MINUTE) > ?
       LIMIT 1`,
      [post_id, start, SLOT_MINUTES, SLOT_MINUTES, start]
    );
    if (conflict.length > 0) {
      const e = new Error('DATE_ALREADY_BOOKED'); e.code = 'DATE_ALREADY_BOOKED'; throw e;
    }

    // gen id แบบง่าย (ใช้ UUID ของ MySQL) — ถ้าอยากใช้ nanoid ก็ได้
    const [idRow] = await conn.query(`SELECT REPLACE(UUID(), '-', '') AS id`);
    const book_id = `bk_${idRow[0].id.slice(0,16)}`;

    await conn.query(
      `INSERT INTO book_logs (book_id, user_id, post_id, book_date)
       VALUES (?, ?, ?, ?)`,
      [book_id, user_id, post_id, start]
    );

    await conn.commit();
    return { book_id, user_id, post_id, book_date: start, slot_minutes: SLOT_MINUTES };
  } catch (err) {
    await conn.rollback();
    if (err && err.code === 'ER_DUP_ENTRY') {
      const e = new Error('DATE_ALREADY_BOOKED'); e.code = 'DATE_ALREADY_BOOKED'; throw e;
    }
    throw err;
  } finally {
    conn.release();
  }
}
