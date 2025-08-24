import { withTx } from '../db.js';
import { genId } from '../utils/id.js';
import { one } from '../utils/sql.js';

export async function topup(user_id, amount, mean_detail='เติมเงิน', description=null) {
  return withTx(async (conn) => {
    const [w] = await conn.execute(`SELECT wallet_id, balance FROM wallets WHERE user_id=? FOR UPDATE`, [user_id]);
    const wal = one(w);
    if (!wal) throw new Error('WALLET_NOT_FOUND');

    const newBal = Number(wal.balance) + Number(amount);
    await conn.execute(`UPDATE wallets SET balance=?, updated_at=NOW() WHERE wallet_id=?`, [newBal, wal.wallet_id]);

    await conn.execute(
      `INSERT INTO wallet_transactions (transaction_id, wallet_id, user_id, amount, transaction_type, mean_detail, description)
       VALUES (?,?,?,?,?,?,?)`,
      [genId('txn'), wal.wallet_id, user_id, amount, 'topup', mean_detail, description]
    );
    return { balance: newBal };
  });
}
