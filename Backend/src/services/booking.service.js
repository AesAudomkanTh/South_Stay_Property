import { withTx } from '../db.js';
import { genId } from '../utils/id.js';
import { one } from '../utils/sql.js';

function slotWindow(dateStr) {
  const d = new Date(dateStr);
  const start = new Date(d);
  const end = new Date(d.getTime() + 60*60*1000);
  return { start, end };
}

export async function createBooking(user_id, post_id, book_date_iso) {
  const { start, end } = slotWindow(book_date_iso);

  return withTx(async (conn) => {
    await conn.execute(`SELECT post_id FROM posters WHERE post_id=? FOR UPDATE`, [post_id]);

    const [conflicts] = await conn.execute(
      `SELECT book_id FROM book_logs
       WHERE post_id=? AND deleted_at IS NULL AND (book_date BETWEEN ? AND ?)
       LIMIT 1 FOR UPDATE`,
      [post_id, start, end]
    );
    if (one(conflicts)) throw new Error('BOOKING_CONFLICT');

    const book_id = genId('bk');
    await conn.execute(
      `INSERT INTO book_logs (book_id, user_id, post_id, book_date)
       VALUES (?,?,?,?)`,
      [book_id, user_id, post_id, new Date(book_date_iso)]
    );
    return { book_id };
  });
}
