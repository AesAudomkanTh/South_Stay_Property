// backend/src/routes/upload.routes.js
import { Router } from "express";
import multer from "multer";
import cloudinary from "../utils/cloudinary.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();

// ใช้ memoryStorage เพื่อส่ง buffer เข้า Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

r.post("/image", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no file" });

    const fileBuf = req.file.buffer;

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "southstay/posts", resource_type: "image" },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(fileBuf);
    });

    // ส่งข้อมูลหลักกลับไปให้ FE ใช้เติมลงฟอร์ม
    return res.json({
      ok: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format,
      resource_type: result.resource_type,
    });
  } catch (err) {
    console.error("[upload/image] error:", err);
    res.status(500).json({ error: "Upload error" });
  }
});

export default r;
