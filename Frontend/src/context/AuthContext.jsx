// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  });

  const isAuthenticated = !!token;

  async function login(usernameOrEmail, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmail, password })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || "รหัสผ่านหรืออีเมลไม่ถูกต้อง");
    }

    const tk = data.token || data?.access_token;
    if (!tk) throw new Error("ไม่พบ token จากเซิร์ฟเวอร์");

    setToken(tk);
    localStorage.setItem("token", tk);

    // ถ้า backend ส่ง snapshot user มาด้วย ก็เก็บไว้เลย
    if (data.user) {
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } else {
      // ไม่ส่งมาก็ยิง /me เพื่อดึงโปรไฟล์
      await fetchMe(tk);
    }

    toast.success("เข้าสู่ระบบสำเร็จ 🎉");
    navigate("/");
  }

  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("ออกจากระบบแล้ว");
    navigate("/");
  }

  async function fetchMe(currentToken = token) {
    if (!currentToken) return;
    try {
      const r = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (r.ok) {
        // ⬅️ /me คืนอ็อบเจกต์ user “แบน” ไม่ใช่ { user: ... }
        const u = await r.json();
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch {
      // เงียบไว้ ไม่ทำให้แอปแตก
    }
  }

  useEffect(() => {
    // ถ้ามี token แต่ยังไม่มี user ในแคช → ลองดึง /me
    if (token && !user) fetchMe(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = { token, user, isAuthenticated, login, logout, setUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
