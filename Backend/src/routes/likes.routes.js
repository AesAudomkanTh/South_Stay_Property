import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { likePost, unlikePost } from '../services/like.service.js';

const r = Router();
r.post('/:post_id/like', requireAuth, async (req, res) => {
  await likePost(req.user.user_id, req.params.post_id);
  res.json({ ok: true });
});
r.post('/:post_id/unlike', requireAuth, async (req, res) => {
  await unlikePost(req.user.user_id, req.params.post_id);
  res.json({ ok: true });
});
export default r;
