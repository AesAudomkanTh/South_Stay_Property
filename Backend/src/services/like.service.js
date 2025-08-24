import { withTx } from '../db.js';
import { genId } from '../utils/id.js';

export async function likePost(user_id, post_id) {
  await withTx(async (conn) => {
    await conn.execute(
      `INSERT INTO post_likes (like_id, user_id, post_id) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE deleted_at=NULL`,
      [genId('like'), user_id, post_id]
    );
  });
  return true;
}

export async function unlikePost(user_id, post_id) {
  await withTx(async (conn) => {
    await conn.execute(
      `UPDATE post_likes SET deleted_at=NOW() WHERE user_id=? AND post_id=? AND deleted_at IS NULL`,
      [user_id, post_id]
    );
  });
  return true;
}
