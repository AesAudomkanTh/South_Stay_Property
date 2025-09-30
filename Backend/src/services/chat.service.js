// src/services/chat.service.js
import { pool } from '../db.js';
import { genId } from '../utils/id.js';

/** บันทึกข้อความ 1 แถว */
export async function saveMessage(sender_id, receiver_id, message_text) {
  await pool.execute(
    `INSERT INTO messages_logs (message_id, sender_id, receiver_id, message_text)
     VALUES (?,?,?,?)`,
    [genId('msg'), sender_id, receiver_id, message_text]
  );
}

/** ดึงรายชื่อบทสนทนาทั้งหมดของ user (คู่สนทนา + ข้อความล่าสุด + จำนวนยังไม่อ่าน) */
export async function getConversations(user_id) {
  // หา "ข้อความล่าสุด" ต่อคู่สนทนา
  const [lasts] = await pool.execute(
    `
    SELECT t.partner_id,
           u.username AS name,
           ml.message_text AS last_text,
           ml.sent_at AS last_at
    FROM (
      SELECT 
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS partner_id,
        MAX(sent_at) AS last_at
      FROM messages_logs
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY partner_id
    ) AS t
    JOIN messages_logs ml
      ON ml.sent_at = t.last_at
     AND (
       (ml.sender_id = ? AND ml.receiver_id = t.partner_id) OR
       (ml.sender_id = t.partner_id AND ml.receiver_id = ?)
     )
    LEFT JOIN users u ON u.user_id = t.partner_id
    ORDER BY t.last_at DESC
    `,
    [user_id, user_id, user_id, user_id, user_id]
  );

  // นับยังไม่อ่าน ต่อ partner
  const [unreads] = await pool.execute(
    `
    SELECT sender_id AS partner_id, COUNT(*) AS unread
    FROM messages_logs
    WHERE receiver_id = ? AND read_at IS NULL
    GROUP BY sender_id
    `,
    [user_id]
  );

  const unreadMap = Object.fromEntries(
    unreads.map(r => [r.partner_id, Number(r.unread || 0)])
  );

  return lasts.map(row => ({
    user_id: row.partner_id,
    name: row.name || null,
    last: { text: row.last_text, at: row.last_at },
    unread: unreadMap[row.partner_id] || 0,
  }));
}

/** ดึงประวัติแชทกับ peer และมาร์คว่าอ่านแล้ว (หลีกเลี่ยง LIMIT ? ที่ทำให้ MySQL error) */
export async function getMessages(user_id, peer_id, limit = 100) {
  // sanitize limit แล้วค่อยฝังเลขลง SQL
  let lim = Number.parseInt(limit, 10);
  if (!Number.isFinite(lim) || lim <= 0) lim = 100;
  if (lim > 200) lim = 200;

  const sql = `
    SELECT message_id, sender_id, receiver_id, message_text, sent_at, read_at
    FROM messages_logs
    WHERE (sender_id = ? AND receiver_id = ?)
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY sent_at ASC
    LIMIT ${lim}
  `;

  // เหลือพารามิเตอร์แค่ 4 ตัว (ตัด LIMIT ? ออกแล้ว)
  const [rows] = await pool.execute(sql, [user_id, peer_id, peer_id, user_id]);

  // มาร์คข้อความที่ "ส่งถึงเรา" ว่าอ่านแล้ว
  await pool.execute(
    `
    UPDATE messages_logs
       SET read_at = NOW()
     WHERE receiver_id = ? AND sender_id = ? AND read_at IS NULL
    `,
    [user_id, peer_id]
  );

  return rows;
}
