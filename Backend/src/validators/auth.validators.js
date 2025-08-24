// src/validators/auth.validators.js
/*import { z } from "zod";

export const RegisterSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  email: z.string().email(),
  telephone: z.string().optional(),
  cid: z.string().optional(),
  first_name_th: z.string().optional(),
  last_name_th: z.string().optional(),
  title_th: z.enum(["นาย", "นางสาว", "นาง"]).optional(),
});

export const LoginSchema = z.object({
  usernameOrEmail: z.string().min(3),
  password: z.string().min(6),
});*/

// src/validators/auth.validators.js
import { z } from "zod";

/** สมัครสมาชิก */
export const RegisterSchema = z.object({
  body: z.object({
    username: z.string().min(3, "username อย่างน้อย 3 ตัวอักษร"),
    password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
    email: z.string().email("อีเมลไม่ถูกต้อง"),
    telephone: z.string().regex(/^\d{9,15}$/, "เบอร์โทรต้องเป็นตัวเลข 9–15 หลัก"),
    cid: z.string().regex(/^\d{13}$/, "เลขบัตรประชาชนต้องมี 13 หลัก"),
    first_name_th: z.string().min(1, "กรุณากรอกชื่อ"),
    last_name_th: z.string().min(1, "กรุณากรอกนามสกุล"),
    title_th: z.enum(["นาย", "นาง", "นางสาว", "อื่นๆ"]),
  }),
});

/** ล็อกอิน */
export const LoginSchema = z.object({
  body: z.object({
    usernameOrEmail: z.string().min(1, "กรุณากรอกชื่อผู้ใช้หรืออีเมล"),
    password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
  }),
});



