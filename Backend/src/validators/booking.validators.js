import { z } from 'zod';
export const CreateBookingSchema = z.object({
  body: z.object({
    post_id: z.string(),
    book_date: z.coerce.date(),
  })
});
