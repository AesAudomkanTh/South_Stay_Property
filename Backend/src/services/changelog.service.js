import { withTx } from '../db.js';
import { genId } from '../utils/id.js';

export async function logUserChange(user_id, field, oldValue, newValue) {
  await withTx(async (conn) => {
    await conn.execute(
      `INSERT INTO user_change_logs (log_id, user_id, changed_field, old_value, new_value, \`updated-at\`)
       VALUES (?,?,?,?,?, NOW())`,
      [genId('ulog'), user_id, field, String(oldValue ?? ''), String(newValue ?? '')]
    );
  });
}
