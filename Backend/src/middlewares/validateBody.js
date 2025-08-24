// src/middlewares/validateBody.js
export const validateBody = (schema) => (req, res, next) => {
  console.log("🧪 [VALIDATE] raw req.body:", req.body);

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    const flat = parsed.error.flatten ? parsed.error.flatten() : parsed.error;
    console.log("🧪 [VALIDATE] fail:", flat);
    return res.status(400).json({ error: "Validation error", details: flat });
  }

  req.body = parsed.data;
  console.log("🧪 [VALIDATE] pass:", req.body);
  next();
};
