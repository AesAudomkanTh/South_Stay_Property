// Backend/src/routes/likes.routes.js
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  toggleLike,
  isLiked,
  countLikes,
  listMyLikes,
} from '../services/likes.service.js';

const r = Router();

/**
 * GET /api/likes/status?post_id=...
 * -> { liked: boolean, count: number }
 */
r.get('/status', requireAuth, async (req, res) => {
  try {
    const post_id = String(req.query.post_id || '');
    if (!post_id) return res.status(400).json({ error: 'INVALID_POST_ID' });

    const [liked, count] = await Promise.all([
      isLiked(req.user.user_id, post_id),
      countLikes(post_id),
    ]);

    res.json({ liked, count });
  } catch (err) {
    console.error('[likes] GET /status error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/likes/toggle  { post_id }
 * -> { liked: boolean, count: number }
 */
r.post('/toggle', requireAuth, async (req, res) => {
  try {
    const post_id = String(req.body?.post_id || '');
    if (!post_id) return res.status(400).json({ error: 'INVALID_POST_ID' });

    const result = await toggleLike(req.user.user_id, post_id);
    res.json(result);
  } catch (err) {
    console.error('[likes] POST /toggle error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/likes/mine
 * -> { likes: [post_id, ...] }
 */
r.get('/mine', requireAuth, async (req, res) => {
  try {
    const ids = await listMyLikes(req.user.user_id);
    res.json({ likes: ids });
  } catch (err) {
    console.error('[likes] GET /mine error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default r;
