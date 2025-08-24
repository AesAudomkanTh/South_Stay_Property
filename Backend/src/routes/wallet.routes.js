import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { topup } from '../services/wallet.service.js';

const r = Router();
r.post('/topup', requireAuth, async (req, res) => {
  const { amount } = req.body;
  const out = await topup(req.user.user_id, Number(amount));
  res.json(out);
});
export default r;
