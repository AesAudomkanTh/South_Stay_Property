/*export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
  }
  next();
};*/

// src/middlewares/validate.js
/*export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: parsed.error.flatten(),
    });
  }
  req.body = parsed.data;
  next();
};*/

// src/middlewares/validate.js
export const validate = (schema) => (req, res, next) => {
  console.log("🧪 [VALIDATE] content-type:", req.headers["content-type"]);
  console.log("🧪 [VALIDATE] raw req.body:", req.body);

  const parsed = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!parsed.success) {
    const flat = parsed.error.flatten ? parsed.error.flatten() : parsed.error;
    console.log("🧪 [VALIDATE] fail:", flat);
    return res.status(400).json({ error: "Validation error", details: flat });
  }

  req.body = parsed.data.body ?? req.body;
  console.log("🧪 [VALIDATE] pass, normalized body:", req.body);
  next();
};








