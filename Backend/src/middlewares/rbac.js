/*export function requireScope(scopeName, minLevel = 1) {
  return (req, res, next) => {
    const scopes = req.user?.scopes || [];
    const found = scopes.find(s => s.scope_name === scopeName && s.level >= minLevel);
    if (!found) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export function requireVerified(req, res, next) {
  if (req.user?.verify_status !== 'verified')
    return res.status(403).json({ error: 'Account not verified' });
  next();
}*/
// src/middlewares/rbac.js
export function requireVerified(req, res, next) {
  const status = req.user?.verify_status;
  if (status !== 'verified' && status !== 1 && status !== '1') {
    return res.status(403).json({ error: 'Account not verified' });
  }
  next();
}

export function requireScope(scopeName, minLevel = 1) {
  return (req, res, next) => {
    const raw = req.user?.scopes || [];

    // รองรับรูปแบบต่างๆ: ['admin'] หรือ [{scope_name:'admin', level:3}] หรือ [{name:'admin', level:3}]
    const scopes = raw.map((s) => {
      if (typeof s === 'string') return { scope_name: s, level: 999 };
      if (s?.scope_name) return { scope_name: s.scope_name, level: s.level ?? 1 };
      if (s?.name) return { scope_name: s.name, level: s.level ?? 1 };
      return null;
    }).filter(Boolean);

    const has = scopes.some((s) => s.scope_name === scopeName && (s.level ?? 1) >= minLevel);
    if (!has) {
      return res.status(403).json({
        error: 'Forbidden',
        need: { scope: scopeName, minLevel },
        have: scopes,
      });
    }
    next();
  };
}
