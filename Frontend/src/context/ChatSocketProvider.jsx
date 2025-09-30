// src/context/ChatSocketProvider.jsx
import React, {
  createContext, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { io } from "socket.io-client";

const ChatCtx = createContext(null);
export const useChat = () => useContext(ChatCtx);

/** ─────────────────────────────────────────────────────────
 *  Socket singleton (กันสร้างซ้ำ โดยเฉพาะตอน React StrictMode)
 *  เริ่มด้วย "polling" ก่อน เพื่อลด websocket error ใน dev
 *  ถ้ายังเห็น error spam มาก สามารถบังคับ polling อย่างเดียวได้โดยใส่ upgrade:false
 *  ───────────────────────────────────────────────────────── */
let __sharedSocket = null;
function getOrCreateSocket(url, token) {
  if (__sharedSocket) return __sharedSocket;

  __sharedSocket = io(url, {
    path: "/socket.io",
    transports: ["polling", "websocket"], // เริ่มด้วย polling เพื่อลด error
    // upgrade: false, // ← เปิดบรรทัดนี้ถ้าต้องการบังคับใช้ polling อย่างเดียวชั่วคราว
    withCredentials: true,
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
    forceNew: false,
  });

  return __sharedSocket;
}

export default function ChatSocketProvider({ children, socketUrl }) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";
  const SOCKET_URL = socketUrl || API_BASE;

  const [conversations, setConversations] = useState([]); // [{user_id, name, last, unread}]
  const [ready, setReady] = useState(false);

  const socketRef = useRef(null);
  const tokenRef  = useRef(null);

  // ───── token helper ─────
  const getToken = () => localStorage.getItem("token") || "";

  // ───── fetch ที่แนบ token + credentials ─────
  async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, {
      credentials: "include",
      ...options,
      headers,
    });

    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // ───── รวม unread ทั้งหมด ─────
  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (Number(c.unread || 0) || 0), 0),
    [conversations]
  );

  // ───── โหลดรายการบทสนทนา ─────
  async function loadConversations() {
    const token = getToken();
    if (!token) {
      setConversations([]);
      setReady(true);
      return;
    }
    try {
      const data = await authFetch(`${API_BASE}/api/chat/conversations`);
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e.status === 401) {
        setConversations([]);
      } else if (e.status === 404) {
        console.warn("[chat] /api/chat/conversations 404 – ตรวจว่าได้ mount app.use('/api/chat', chatRoutes) แล้วหรือยัง");
      } else {
        console.error("[chat] loadConversations error:", e);
      }
    } finally {
      setReady(true);
    }
  }

  // ───── socket handlers ─────
  const detachSocketHandlers = (s) => {
    if (!s) return;
    s.off("connect");
    s.off("disconnect");
    s.off("connect_error");
    s.off("dm");
    s.off("dm:self");
  };

  const attachSocketHandlers = (s) => {
    if (!s) return;
    // กันซ้อน
    detachSocketHandlers(s);

    s.on("connect", () => {
      console.log("[socket] connected:", s.id);
    });

    s.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", reason);
    });

    s.on("connect_error", (err) => {
      console.warn("[socket] connect_error:", err?.message || err);
    });

    // ข้อความ "เข้า" จากคู่สนทนา
    s.on("dm", (payload) => {
      const from = String(payload?.from ?? "");
      const text = payload?.text ?? "";
      const at   = payload?.at   ?? new Date().toISOString();

      setConversations((prev) => {
        const list = [...prev];
        const i = list.findIndex((c) => String(c.user_id) === from);
        if (i >= 0) {
          const item = { ...list[i] };
          item.last = { text, at };
          item.unread = (Number(item.unread || 0) || 0) + 1;
          list[i] = item;
        } else {
          list.unshift({
            user_id: from,
            name: "ผู้ใช้",
            last: { text, at },
            unread: 1,
          });
        }
        return list;
      });

      // แจ้งหน้า ChatPage ให้เติมข้อความทันที (id เป็น string เสมอ)
      window.dispatchEvent(new CustomEvent("chat:dm", { detail: { from, text, at } }));
    });

    // ข้อความที่ "เราส่งเอง" (server echo กลับมา) — ช่วย sync กับแท็บอื่น ๆ
    s.on("dm:self", (payload) => {
      const to  = String(payload?.to ?? "");
      const text = payload?.text ?? "";
      const at   = payload?.at   ?? new Date().toISOString();

      window.dispatchEvent(new CustomEvent("chat:dm:self", { detail: { to, text, at } }));
    });
  };

  // ───── ต่อ socket เมื่อมี token ─────
  function ensureSocket() {
    const token = getToken();
    if (!token) return;

    tokenRef.current = token;
    const s = getOrCreateSocket(SOCKET_URL, token);

    attachSocketHandlers(s);
    socketRef.current = s;

    // ถ้า instance มีอยู่แต่ยังไม่ต่อ ให้ลอง connect
    if (!s.connected) {
      try { s.connect(); } catch {}
    }
  }

  // ───── ปิดจริง ๆ (ใช้ตอนล็อกเอาต์) ─────
  function hardDisconnect() {
    const s = socketRef.current || __sharedSocket;
    if (s) {
      detachSocketHandlers(s);
      try { s.close(); } catch {}
    }
    socketRef.current = null;
    __sharedSocket = null;
  }

  // ───── lifecycle ─────
  useEffect(() => {
    loadConversations();
    ensureSocket();

    const onStorage = (e) => {
      if (e.key === "token" || e.key === "accessToken") {
        const newToken = getToken();
        const oldToken = tokenRef.current;

        if (!newToken) {
          hardDisconnect();
          setConversations([]);
        } else if (newToken !== oldToken) {
          tokenRef.current = newToken;
          const s = socketRef.current || __sharedSocket;
          if (s) {
            detachSocketHandlers(s);
            try { s.auth = { token: newToken }; } catch {}
            s.disconnect();
            setReady(false);
            setTimeout(() => {
              s.connect();
              attachSocketHandlers(s);
              loadConversations();
              socketRef.current = s;
            }, 0);
          } else {
            ensureSocket();
            loadConversations();
          }
        }
      }
    };

    const onBeforeUnload = () => {
      try { hardDisconnect(); } catch {}
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("storage", onStorage);
      //window.removeEventListener("beforeunload", onBeforeunload);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (socketRef.current) detachSocketHandlers(socketRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───── ส่งข้อความแบบ realtime (มี ack + fallback HTTP) ─────
  function sendDm(to_user_id, text) {
    if (!to_user_id || !text?.trim()) return;
    const s = socketRef.current || __sharedSocket;
    const clean = text.trim();
    const toId  = String(to_user_id);

    if (s?.connected) {
      s.emit("dm", { to_user_id: toId, text: clean }, (ack) => {
        if (ack && ack.ok) return;
        // fallback ถ้า server ไม่ ack
        authFetch(`${API_BASE}/api/chat/dm`, {
          method: "POST",
          body: JSON.stringify({ to_user_id: toId, text: clean }),
        }).catch((e) => console.warn("[dm] fallback HTTP failed:", e?.message || e));
      });
    } else {
      // fallback ถ้า socket หลุด
      authFetch(`${API_BASE}/api/chat/dm`, {
        method: "POST",
        body: JSON.stringify({ to_user_id: toId, text: clean }),
      }).catch((e) => console.warn("[dm] fallback HTTP failed:", e?.message || e));
    }
  }

  // ───── mark read ─────
  async function markRead(partner_id) {
    try {
      const pid = String(partner_id);
      await authFetch(`${API_BASE}/api/chat/history/${pid}?limit=1`);
      setConversations((prev) =>
        prev.map((c) => (String(c.user_id) === pid ? { ...c, unread: 0 } : c))
      );
    } catch {
      // เงียบไว้
    }
  }

  const value = useMemo(
    () => ({
      ready,
      conversations,
      totalUnread,
      reload: loadConversations,
      sendDm,
      markRead,
      authFetch,
    }),
    [ready, conversations, totalUnread]
  );

  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>;
}
