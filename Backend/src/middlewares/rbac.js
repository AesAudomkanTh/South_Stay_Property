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
/* export function requireVerified(req, res, next) {
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
} */

/*export function requireScope(scopeName, minLevel = 1) {
  return (req, res, next) => {
    const raw = req.user?.scopes ?? [];
    let scopes = [];

    if (Array.isArray(raw)) {
      scopes = raw
        .map((s) => {
          if (typeof s === 'string') return { scope_name: s, level: 999 };
          if (s?.scope_name || s?.name) return { scope_name: s.scope_name || s.name, level: s.level ?? 1 };
          return null;
        })
        .filter(Boolean);
    } else if (raw && typeof raw === 'object') {
      // รองรับ object map: { admin: 1 }
      scopes = Object.entries(raw).map(([name, lvl]) => ({ scope_name: name, level: Number(lvl) || 1 }));
    }

    const allowed = scopes.some((s) => s.scope_name === scopeName && (s.level ?? 1) >= minLevel);
    if (!allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        need: { scope: scopeName, minLevel },
        have: scopes,
      });
    }
    next();
  };
} */

// backend/src/middlewares/rbac.js
/*export function normalizeScopes(raw) {
  return (raw || [])
    .map((s) => {
      if (typeof s === 'string') return { scope_name: s, level: 999 };
      if (s?.scope_name) return { scope_name: s.scope_name, level: Number(s.level) || 1 };
      if (s?.name) return { scope_name: s.name, level: Number(s.level) || 1 };
      return null;
    })
    .filter(Boolean);
}

export function requireScope(scopeName, minLevel = 1) {
  return (req, res, next) => {
    const scopes = normalizeScopes(req.user?.scopes);
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
} */

/** ✅ ใหม่: ผ่านได้ถ้าตรง “อย่างน้อยหนึ่ง” คู่ (scope, minLevel) */
/*export function requireAnyScope(list) {
  const reqs = (list || [])
    .map((x) => {
      if (typeof x === 'string') return { scope_name: x, minLevel: 1 };
      if (Array.isArray(x)) return { scope_name: x[0], minLevel: Number(x[1]) || 1 };
      if (x?.scope_name) return { scope_name: x.scope_name, minLevel: Number(x.minLevel) || Number(x.level) || 1 };
      return null;
    })
    .filter(Boolean);

  return (req, res, next) => {
    const scopes = normalizeScopes(req.user?.scopes);
    const ok = reqs.some((rq) => scopes.some((s) => s.scope_name === rq.scope_name && (s.level ?? 1) >= rq.minLevel));
    if (!ok) {
      return res.status(403).json({ error: 'Forbidden', needAny: reqs, have: scopes });
    }
    next();
  };
} */

 // backend/src/middlewares/rbac.js
/**
 * RBAC helpers + middlewares
 * รองรับรูปแบบ scopes ใน JWT ได้ทั้ง:
 *  - ['admin', 'vendor']           (string => level 999)
 *  - [{ scope_name:'admin', level:3 }, { name:'vendor', level:1 }]
 */

// backend/src/middlewares/rbac.js
function _normalizeScopes(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((s) => {
      if (typeof s === 'string') return { scope_name: s, level: 999 };
      if (s && typeof s === 'object') {
        if (s.scope_name) return { scope_name: s.scope_name, level: s.level ?? 1 };
        if (s.name) return { scope_name: s.name, level: s.level ?? 1 };
      }
      return null;
    })
    .filter(Boolean);
}

export function hasScope(user, name, minLevel = 1) {
  const scopes = _normalizeScopes(user?.scopes);
  return scopes.some((s) => s.scope_name === name && (s.level ?? 1) >= (minLevel ?? 1));
}

export function hasAnyScope(user, pairs) {
  const scopes = _normalizeScopes(user?.scopes);
  return (pairs || []).some(([name, min]) =>
    scopes.some((s) => s.scope_name === name && (s.level ?? 1) >= (min ?? 1))
  );
}

export function requireScope(scopeName, minLevel = 1) {
  return (req, res, next) => {
    if (hasScope(req.user, scopeName, minLevel)) return next();
    const have = _normalizeScopes(req.user?.scopes);
    return res.status(403).json({ error: 'Forbidden', need: { scope: scopeName, minLevel }, have });
  };
}

export function requireAnyScope(pairs) {
  return (req, res, next) => {
    if (hasAnyScope(req.user, pairs)) return next();
    const have = _normalizeScopes(req.user?.scopes);
    return res.status(403).json({ error: 'Forbidden', needAnyOf: pairs, have });
  };
}






