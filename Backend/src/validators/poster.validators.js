// src/validators/poster.validators.js
import { z } from "zod";

// 🔹 Schema เวอร์ชันเก่า (ถ้ามี) ยังเก็บไว้ใช้ได้
export const CreatePosterSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title is required"),
    description: z.string().min(5, "Description is required"),
    post_type: z.enum(["sale", "rent"]),
    property_type: z.enum(["house", "condo", "land", "other"]),
    price: z.number().positive(),
    bed_room: z.number().int().nonnegative(),
    bath_room: z.number().int().nonnegative(),
    kitchen_room: z.number().int().nonnegative().optional(),
    latitude: z.number(),
    longitude: z.number(),
    images: z
      .array(
        z.object({
          name: z.string(),
          image_url: z.string().url(),
        })
      )
      .optional(),
  }),
});

// 🔹 Schema เวอร์ชันใหม่ (flat object) สำหรับ validateBody()
export const CreatePosterSchemaNew = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(5, "Description is required"),
  post_type: z.enum(["sale", "rent"]),
  property_type: z.enum(["house", "condo", "land", "other"]),
  price: z.number().positive(),
  bed_room: z.number().int().nonnegative(),
  bath_room: z.number().int().nonnegative(),
  kitchen_room: z.number().int().nonnegative().optional(),
  latitude: z.number(),
  longitude: z.number(),
  images: z
    .array(
      z.object({
        name: z.string(),
        image_url: z.string().url(),
      })
    )
    .optional(),
});
