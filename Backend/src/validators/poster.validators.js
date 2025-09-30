import { z } from 'zod';

/** รองรับทั้ง string URL และ object { name?, image_url, is_primary?, sort_order? } */
const ImageItem = z.union([
  z.string().url(),
  z.object({
    name: z.string().max(255).optional(),
    image_url: z.string().url(),
    is_primary: z.boolean().optional(),
    sort_order: z.number().int().min(0).optional(),
  }).strict(),
]);

/** สคีมาสร้างโพสต์ (coerce number เพื่อกันเคสส่งมาเป็น string) */
export const CreatePosterSchemaNew = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  post_type: z.enum(['sale', 'rent']),
  property_type: z.enum(['house', 'condo', 'land', 'other']),
  price: z.coerce.number().min(0),

  bed_room: z.coerce.number().int().min(0).max(255).optional(),
  bath_room: z.coerce.number().int().min(0).max(255).optional(),
  kitchen_room: z.coerce.number().int().min(0).max(255).optional(),

  latitude: z.coerce.number().gte(-90).lte(90),
  longitude: z.coerce.number().gte(-180).lte(180),

  images: z.array(ImageItem).min(1).max(20),

  project: z.string().optional(),
  address: z.string().optional(),
  province: z.string().optional(),
  floor: z.coerce.number().int().optional(),
  parking: z.coerce.number().int().min(0).max(255).optional(),
  land_area: z.coerce.number().min(0).optional(),
  feasibility: z.string().optional(),
});

/** สคีมาแก้ไขโพสต์ (partial ทั้งหมด) */
export const UpdatePosterSchemaNew = CreatePosterSchemaNew.partial().extend({
  images: z.array(ImageItem).optional(),
});

/** แปลง images ให้เป็นรูปแบบเดียวกันก่อนส่งเข้า service */
export function normalizeImages(input) {
  const arr = Array.isArray(input) ? input : [];
  return arr
    .map((it, i) => {
      if (typeof it === 'string') {
        return {
          name: `image_${i + 1}`,
          image_url: it,
          is_primary: i === 0 ? 1 : 0,
          sort_order: i,
        };
      }
      return {
        name: it.name || `image_${i + 1}`,
        image_url: it.image_url,
        is_primary: it.is_primary ? 1 : (i === 0 ? 1 : 0),
        sort_order: Number.isInteger(it.sort_order) ? it.sort_order : i,
      };
    })
    .filter(x => !!x.image_url);
}
