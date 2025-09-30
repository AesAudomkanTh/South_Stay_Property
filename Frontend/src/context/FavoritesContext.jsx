// src/context/FavoritesContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authFetch, API_BASE } from "../utils/authFetch";

const FavoritesContext = createContext(null);

function getToken() {
  return localStorage.getItem("token") || "";
}

export function FavoritesProvider({ children }) {
  // เก็บเป็น Set เพื่อเช็คเร็ว + กันซ้ำ
  const [ids, setIds] = useState(() => {
    try {
      const raw = localStorage.getItem("favorites:v1");
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.map(String) : []);
    } catch {
      return new Set();
    }
  });

  // sync -> localStorage เสมอ (ใช้เป็น cache/offline)
  useEffect(() => {
    localStorage.setItem("favorites:v1", JSON.stringify([...ids]));
  }, [ids]);

  // ดึงรายการถูกใจจริงจากเซิร์ฟเวอร์ (ถ้าล็อกอิน)
  async function syncFromServer() {
    const token = getToken();
    if (!token) return; // ยังไม่ล็อกอิน ก็ใช้ cache ไปก่อน
    try {
      const { likes } = await authFetch(`${API_BASE}/api/likes/mine`);
      const serverIds = new Set((likes || []).map(String));
      setIds(serverIds);
    } catch (e) {
      // ถ้าดึงไม่สำเร็จอย่าไป clear state — ให้ใช้ค่าที่มีอยู่ไปก่อน
      console.warn("[favorites] load from server failed:", e?.message || e);
    }
  }

  // โหลดครั้งแรก + reload เมื่อ token เปลี่ยน (login/logout)
  useEffect(() => {
    syncFromServer();

    const onStorage = (e) => {
      if (e.key === "token") {
        // token เปลี่ยน -> รีโหลดจากเซิร์ฟเวอร์ใหม่
        syncFromServer();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // toggle แบบ optimistic + ยิง API (ถ้ามี token)
  const toggleFavorite = async (post_id) => {
    if (!post_id) return;
    const id = String(post_id);

    const had = ids.has(id);

    // 1) optimistic
    setIds((prev) => {
      const next = new Set(prev);
      had ? next.delete(id) : next.add(id);
      return next;
    });

    const token = getToken();
    if (!token) {
      // ยังไม่ล็อกอิน — เก็บแค่ local ให้ UI ลื่นๆ ไปก่อน
      return;
    }

    // 2) ยิง API เพื่อบันทึกจริง
    try {
      const { liked } = await authFetch(`${API_BASE}/api/likes/toggle`, {
        method: "POST",
        body: JSON.stringify({ post_id: id }),
      });

      // 3) reconcile กับค่าจาก server (กันกรณี optimistic ไม่ตรง)
      setIds((prev) => {
        const next = new Set(prev);
        if (liked) next.add(id);
        else next.delete(id);
        return next;
      });
    } catch (e) {
      console.error("[favorites] toggle failed:", e?.message || e);

      // 4) revert ถ้า API พัง
      setIds((prev) => {
        const next = new Set(prev);
        // กลับสู่สถานะก่อนหน้า (had)
        if (had) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const value = useMemo(
    () => ({
      isFavorite: (id) => (id ? ids.has(String(id)) : false),
      toggleFavorite,
      favorites: ids,         // Set<string>
      refreshFavorites: syncFromServer, // เผื่อเรียกรีเฟรชจากเพจอื่น
    }),
    [ids]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
