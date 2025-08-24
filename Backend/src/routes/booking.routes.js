import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { CreateBookingSchema } from '../validators/booking.validators.js';
import { createBooking } from '../services/booking.service.js';

const r = Router();

r.post('/', requireAuth, validate(CreateBookingSchema), async (req, res) => {
  const { post_id, book_date } = req.body;
  try {
    const out = await createBooking(req.user.user_id, post_id, book_date);
    res.json(out);
  } catch (e) {
    if (e.message === 'BOOKING_CONFLICT')
      return res.status(409).json({ error: 'Time slot already booked' });
    throw e;
  }
});

export default r;
