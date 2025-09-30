import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

export default function BookingModal({ open, onClose, postId = "", partnerId }) {
  const [month, setMonth] = useState(() => new Date().getMonth() + 1); // 1-12
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [bookedDays, setBookedDays] = useState([]); // ['YYYY-MM-DD', ...]
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [modalPostId, setModalPostId] = useState(postId || "");

  useEffect(() => {
    if (!open) return;
    // เมื่อเปิดโมดัล sync postId จาก props
    setModalPostId(postId || "");
    setErr("");
    setDateStr("");
    setTimeStr("");
  }, [open, postId]);

  const token = useMemo(() => localStorage.getItem("token") || "", []);
  async function authFetch(url, options = {}) {
    const headers = options.headers ? { ...options.headers } : {};
    if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers, credentials: "include" });
    const raw = await res.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }
    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      const e = new Error(msg); e.status = res.status; throw e;
    }
    return data;
  }

  // โหลดวันถูกจองของเดือน
  async function loadMonth() {
    setBookedDays([]);
    setErr("");
    const pid = extractPostId(modalPostId);
    if (!pid) return; // ยังไม่กรอก postId ก็ยังไม่เรียก
    try {
      const q = new URLSearchParams({ year: String(year), month: String(month) }).toString();
      const data = await authFetch(`${API_BASE}/api/bookings/post/${pid}/month?${q}`);
      setBookedDays(Array.isArray(data?.booked_days) ? data.booked_days : []);
    } catch (e) {
      setErr(`โหลดข้อมูลเดือนล้มเหลว: ${e.message}`);
    }
  }

  useEffect(() => {
    if (open) loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, month, year, modalPostId]);

  // แปลง input เป็นรหัส post (รองรับวางลิงก์แล้วตัดเอา post_xxx ออกมา)
  function extractPostId(x) {
    const s = String(x || "");
    const m = s.match(/post_[A-Za-z0-9]+/);
    return m ? m[0] : "";
  }

  // เวลาที่ให้เลือก (ทุก 30 นาที; ปรับได้)
  const timeOptions = useMemo(() => {
    const items = [];
    for (let h = 8; h <= 20; h++) {         // 08:00 - 20:00
      for (let m = 0; m < 60; m += 30) {    // step 30 นาที
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        items.push(`${hh}:${mm}`);
      }
    }
    return items;
  }, []);

  // กดยืนยัน
  async function onSubmit() {
    setErr("");
    const pid = extractPostId(modalPostId);
    if (!pid) { setErr("กรุณากรอกรหัสโพสต์ เช่น post_XXXXX"); return; }
    if (!dateStr) { setErr("กรุณาเลือกวันที่"); return; }
    if (!timeStr) { setErr("กรุณาเลือกเวลา"); return; }

    setBusy(true);
    try {
      // POST /api/bookings  (ฝั่งเซิร์ฟเวอร์ที่เราทำรองรับ {post_id, date:'YYYY-MM-DD', time:'HH:mm'})
      const body = { post_id: pid, date: dateStr, time: timeStr, to_user_id: partnerId || "" };
      await authFetch(`${API_BASE}/api/bookings`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      // แจ้งผล แล้วปิด
      onClose?.();
    } catch (e) {
      if (e.status === 409) setErr("ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกใหม่");
      else setErr(`จองไม่สำเร็จ: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="w-[520px] max-w-[92vw] rounded-xl bg-[#0b0b0d] border border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="font-semibold">จองวัน/เวลา เข้าดูทรัพย์</div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
        </div>

        <div className="p-4 space-y-3">
          {/* รหัสโพสต์ */}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">รหัสโพสต์ (เช่น post_XXXX หรือวางลิงก์โพสต์ได้)</label>
            <input
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white"
              placeholder="post_6rPu4XiDhhG4"
              value={modalPostId}
              onChange={(e) => setModalPostId(e.target.value)}
              onBlur={() => loadMonth()}
            />
          </div>

          {/* เลือกเดือน/ปี */}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <select
              className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {[...Array(12)].map((_, i) => {
                const m = i + 1;
                return <option key={m} value={m}>{String(m).padStart(2, "0")}</option>;
              })}
            </select>
            <select
              className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 0 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700"
              onClick={loadMonth}
            >
              รีเฟรชเดือนนี้
            </button>
          </div>

          {/* สรุปวันถูกจองของเดือนนี้ (แบบย่อ) */}
          <div className="text-xs text-zinc-400">
            {bookedDays.length === 0 ? "เดือนนี้ยังไม่มีวันถูกจอง" : (
              <>วันที่ถูกจองแล้ว: {bookedDays.join(", ")}</>
            )}
          </div>

          {/* เลือกวัน */}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">เลือกวัน (YYYY-MM-DD)</label>
            <input
              type="date"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </div>

          {/* เลือกเวลา */}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">เลือกเวลา (สล็อต 30 นาที)</label>
            <select
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
            >
              <option value="">-- เลือกเวลา --</option>
              {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {!!err && <div className="text-red-400 text-sm">{err}</div>}
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">
          <button className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700" onClick={onClose}>ยกเลิก</button>
          <button
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
            onClick={onSubmit}
            disabled={busy}
          >
            {busy ? "กำลังจอง..." : "ยืนยันการจอง"}
          </button>
        </div>
      </div>
    </div>
  );
}
