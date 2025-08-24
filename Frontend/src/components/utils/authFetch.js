// src/utils/authFetch.js
export async function authFetch(url, options = {}) {
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
}
