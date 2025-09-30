import React, { useEffect, useState } from "react";
import { useChat } from "../context/ChatSocketProvider";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import BookingModal from "../components/BookingModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

export default function ChatPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // จาก Provider
  const { ready, conversations, reload, sendDm, markRead } = useChat();

  // UI state
  const [active, setActive] = useState(null);     // { user_id, name, ... }
  const [messages, setMessages] = useState([]);   // rows จาก DB หรือ optimistic
  const [text, setText] = useState("");

  // Booking UI
  const [openBooking, setOpenBooking] = useState(false);
  const [defaultPostId, setDefaultPostId] = useState("");

  // -------- helper: auth fetch (local) --------
  const getToken = () => localStorage.getItem("token") || "";
  async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = options.headers ? { ...options.headers } : {};
    if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, { ...options, headers, credentials: "include" });
    const raw = await res.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }
    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // -------- my user id --------
  const [myUserId, setMyUserId] = useState(String(localStorage.getItem("user_id") || ""));
  useEffect(() => {
    if (!myUserId) {
      const t = getToken();
      if (t && t.includes(".")) {
        try {
          const payload = JSON.parse(atob(t.split(".")[1]));
          if (payload?.user_id) {
            setMyUserId(String(payload.user_id));
            localStorage.setItem("user_id", String(payload.user_id));
          }
        } catch {}
      }
    }
  }, [myUserId]);

  // -------- guard --------
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    reload?.();
  }, [isAuthenticated, navigate, reload]);

  // helper: push message + autoscroll
  function pushMessage(row) {
    setMessages((prev) => [...prev, row]);
    requestAnimationFrame(() => {
      const box = document.getElementById("chat-scroll");
      if (box) box.scrollTop = box.scrollHeight;
    });
  }

  // เมื่อเลือกคู่สนทนา -> mark read + โหลดข้อความ
  useEffect(() => {
    if (!active?.user_id) {
      setMessages([]);
      return;
    }
    const pid = String(active.user_id);
    markRead?.(pid);
    loadMessages(pid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.user_id]);

  // realtime: incoming
  useEffect(() => {
    function onIncoming(e) {
      const { from, text, at } = e.detail || {};
      if (!from || !active?.user_id) return;
      if (String(from) === String(active.user_id)) {
        pushMessage({
          sender_id: String(from),
          receiver_id: String(myUserId),
          message_text: text,
          sent_at: at,
        });
        markRead?.(String(active.user_id));
      }
    }
    window.addEventListener("chat:dm", onIncoming);
    return () => window.removeEventListener("chat:dm", onIncoming);
  }, [active?.user_id, myUserId, markRead]);

  // realtime: dm:self
  useEffect(() => {
    function onSelf(e) {
      const { to, text, at } = e.detail || {};
      if (!to || !active?.user_id) return;
      if (String(to) === String(active.user_id)) {
        pushMessage({
          sender_id: String(myUserId || "me"),
          receiver_id: String(to),
          message_text: text,
          sent_at: at,
          from_self: true,
        });
      }
    }
    window.addEventListener("chat:dm:self", onSelf);
    return () => window.removeEventListener("chat:dm:self", onSelf);
  }, [active?.user_id, myUserId]);

  // autoscroll
  useEffect(() => {
    const box = document.getElementById("chat-scroll");
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages.length, active?.user_id]);

  // โหลดข้อความ
  async function loadMessages(partnerId) {
    try {
      const data = await authFetch(`${API_BASE}/api/chat/history/${partnerId}`);
      setMessages(Array.isArray(data) ? data : []);
      requestAnimationFrame(() => {
        const box = document.getElementById("chat-scroll");
        if (box) box.scrollTop = box.scrollHeight;
      });
    } catch (e) {
      console.error("[ChatPage] loadMessages error:", e);
      setMessages([]);
    }
  }

  // ส่งข้อความ
  async function onSend(e) {
    e.preventDefault();
    if (!text.trim() || !active?.user_id) return;

    const clean = text.trim();
    const pid = String(active.user_id);

    sendDm?.(pid, clean); // realtime

    const now = new Date().toISOString();
    pushMessage({
      sender_id: String(myUserId || "me"),
      receiver_id: pid,
      message_text: clean,
      sent_at: now,
      from_self: true,
    });

    setText("");
  }

  // เมื่อจองสำเร็จ -> ปิดโมดอล + ส่งข้อความแจ้งในห้องแชท
  function handleBooked(b) {
    if (!b || !active?.user_id) return;
    const msg = `📅 ยืนยันการจองดูทรัพย์ | post:${b.post_id} | เวลา: ${new Date(b.book_date).toLocaleString("th-TH")} | เลขที่จอง: ${b.book_id}`;
    sendDm?.(String(active.user_id), msg);
    // โชว์ในหน้าปัจจุบันทันที (optimistic)
    pushMessage({
      sender_id: String(myUserId || "me"),
      receiver_id: String(active.user_id),
      message_text: msg,
      sent_at: new Date().toISOString(),
      from_self: true,
    });
    // อัปเดตรายการบทสนทนาฝั่งซ้ายให้โชว์ last ทันที
    reload?.();
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 text-white">
      <h1 className="text-xl font-semibold mb-4">แชท</h1>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
        {/* ซ้าย: รายการบทสนทนา */}
        <aside className="bg-[#0b0b0d] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-800 text-sm text-zinc-400">
            บทสนทนา {ready ? `(${conversations?.length || 0})` : "(กำลังโหลด…)"}
          </div>
          <ul className="max-h-[70vh] overflow-y-auto">
            {(conversations || []).map((c) => (
              <li
                key={String(c.user_id)}
                onClick={() => setActive(c)}
                className={`px-4 py-3 cursor-pointer hover:bg-zinc-900 ${String(active?.user_id) === String(c.user_id) ? "bg-zinc-900" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{c.name || c.user_id}</div>
                  {Number(c.unread || 0) > 0 && (
                    <span className="ml-2 bg-red-600 text-white text-[11px] rounded-full px-2 py-0.5">
                      {c.unread}
                    </span>
                  )}
                </div>
                {c.last?.text && (
                  <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{c.last.text}</div>
                )}
              </li>
            ))}
            {ready && (conversations || []).length === 0 && (
              <li className="px-4 py-6 text-center text-zinc-500">ยังไม่มีบทสนทนา</li>
            )}
          </ul>
        </aside>

        {/* ขวา: กล่องแชท */}
        <section className="bg-[#0b0b0d] border border-zinc-800 rounded-xl flex flex-col min-h-[60vh]">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            {active ? (
              <>
                <div className="font-medium">{active.name || active.user_id}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // ถ้ามี post_id ผูกมากับห้อง สามารถ setDefaultPostId() ตรงนี้ได้
                      setDefaultPostId("");
                      setOpenBooking(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm"
                  >
                    จองวันดูทรัพย์
                  </button>
                </div>
              </>
            ) : (
              <div className="text-zinc-400 text-sm">เลือกบทสนทนาทางซ้ายเพื่อเริ่มคุย</div>
            )}
          </div>

          {/* รายการข้อความ */}
          <div id="chat-scroll" className="flex-1 overflow-y-auto p-4 space-y-3">
            {active ? (
              (messages || []).map((m, i) => {
                const isMe =
                  m.from === "me" ||
                  m.from_self === true ||
                  (myUserId && String(m.sender_id) === String(myUserId));
                return (
                  <div
                    key={i}
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      isMe
                        ? "ml-auto bg-emerald-700/30 border border-emerald-800"
                        : "bg-zinc-800/60 border border-zinc-700"
                    }`}
                  >
                    <div className="text-sm">{m.text || m.message_text}</div>
                    <div className="text-[10px] text-zinc-400 mt-1">
                      {new Date(m.at || m.sent_at || Date.now()).toLocaleString("th-TH")}
                    </div>
                  </div>
                );
              })
            ) : null}
          </div>

          {/* กล่องพิมพ์ */}
          <form onSubmit={onSend} className="p-3 border-t border-zinc-800 flex gap-2">
            <input
              className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white disabled:opacity-50"
              placeholder={active ? "พิมพ์ข้อความ..." : "เลือกคู่สนทนาก่อน"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!active}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
              disabled={!active || !text.trim()}
            >
              ส่ง
            </button>
          </form>
        </section>
      </div>

      {/* โมดอลจอง */}
      <BookingModal
        open={openBooking}
        onClose={() => setOpenBooking(false)}
        defaultPostId={defaultPostId}
        onBooked={handleBooked}
      />
    </div>
  );
}
