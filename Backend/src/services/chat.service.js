import { withTx } from '../db.js';
import { genId } from '../utils/id.js';

export async function saveMessage(sender_id, receiver_id, message_text) {
  await withTx(async (conn) => {
    await conn.execute(
      `INSERT INTO messages_logs (message_id, sender_id, receiver_id, message_text)
       VALUES (?,?,?,?)`,
      [genId('msg'), sender_id, receiver_id, message_text]
    );
  });
}
