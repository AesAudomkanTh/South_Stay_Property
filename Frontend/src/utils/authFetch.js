// src/utils/authFetch.js
/*export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token') || '';
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  // ถ้า body เป็น JSON ใส่ content-type ให้ และแปลงเป็น string ถ้ายังไม่ได้แปลง
  const isForm = options.body instanceof FormData;
  if (!isForm) headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  // พยายามอ่าน json ถ้าไม่ได้จะคืนเป็น text
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  if (!res.ok) {
    const msg =
      res.status === 401 ? 'Unauthorized' :
      res.status === 403 ? 'Forbidden' :
      data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
} */

// src/utils/authFetch.js
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050';

export function getToken() {
  return localStorage.getItem('token') || '';
}

/**
 * ใช้เรียก API ที่ต้องส่ง JWT/cookie
 * - ถ้า url เริ่มด้วย "/" จะ prefix ด้วย API_BASE ให้อัตโนมัติ
 * - รองรับ FormData (ไม่เซ็ต Content-Type)
 * - ถ้า body เป็น object จะ stringify ให้เอง
 * - ใส่ credentials:'include' เสมอ (เผื่อใช้ httpOnly cookie)
 */
export async function authFetch(url, options = {}) {
  const fullUrl = /^https?:\/\//i.test(url)
    ? url
    : `${API_BASE.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;

  const token = getToken();
  const isForm = options.body instanceof FormData;

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (!isForm) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // auto stringify body ถ้าเป็น object และไม่ได้เป็น FormData/สตริง
  let body = options.body;
  if (!isForm && body != null && typeof body === 'object' && !(body instanceof Blob)) {
    body = JSON.stringify(body);
  }

  const res = await fetch(fullUrl, {
    credentials: 'include',
    ...options,
    headers,
    body,
  });

  // 204/ไม่มีเนื้อหา
  if (res.status === 204) return {};

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      res.status === 401
        ? 'Unauthorized'
        : res.status === 403
        ? 'Forbidden'
        : data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

