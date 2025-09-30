// src/components/PostCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

export default function PropertyCard({ item }) {
  const nav = useNavigate();
  if (!item) return null;

  // ---------- normalize ----------
  const defaults = {
    id: null,
    title: "ไม่ระบุชื่อประกาศ",
    images: [],
    photoCount: undefined,
    price: 0,
    priceSuffix: "/เดือน",
    beds: 0,
    baths: 0,
    area: 0,
    areaUnit: "ตร.ม.",
    type: "",
    province: "",
    location: "",
    recommended: false,
    mode: "rent",
    likes_count: 0,
    liked: false,
  };
  const safe = { ...defaults, ...item };
  const canGoDetail = !!safe.id;

  const nf = useMemo(() => new Intl.NumberFormat("th-TH"), []);
  const priceText = Number.isFinite(Number(safe.price))
    ? nf.format(Number(safe.price))
    : "–";

  const firstImage =
    (Array.isArray(safe.images) && safe.images[0]) ||
    "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
          <rect width='100%' height='100%' fill='#111' />
          <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#666' font-size='24'>No Image</text>
        </svg>`
      );

  // ---------- likes state (ผูกกับ DB) ----------
  const [liked, setLiked] = useState(!!safe.liked);
  const [likeCount, setLikeCount] = useState(Number(safe.likes_count || 0));
  const [busy, setBusy] = useState(false);

  // โหลดสถานะ like ล่าสุดจากเซิร์ฟเวอร์ (กันกรณีเปิดหลายแท็บ/หน้า)
  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      if (!safe.id) return;
      try {
        const token = localStorage.getItem("token") || "";
        if (!token) return; // ไม่ล็อกอินก็ไม่ต้องเช็ค
        const data = await authFetch(
          `/api/likes/status?post_id=${encodeURIComponent(String(safe.id))}`
        );
        if (!cancelled) {
          if (typeof data?.liked !== "undefined") setLiked(!!data.liked);
          if (typeof data?.count !== "undefined") setLikeCount(Number(data.count || 0));
        }
      } catch {
        /* เงียบไว้ ไม่บล็อก UI */
      }
    }
    loadStatus();
    return () => { cancelled = true; };
  }, [safe.id]);

  // ---------- handlers ----------
  const goDetail = () => {
    if (!canGoDetail) return;
    nav(`/property/${safe.id}`, { state: { id: safe.id } });
  };

  async function onToggleLike() {
    if (!safe.id || busy) return;

    // บังคับล็อกอินก่อน
    const token = localStorage.getItem("token") || "";
    if (!token) {
      nav("/login");
      return;
    }

    // optimistic UI
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((n) => n + (nextLiked ? 1 : -1));
    setBusy(true);

    try {
      const { liked: srvLiked, count: srvCount } = await authFetch(
        "/api/likes/toggle",
        { method: "POST", body: { post_id: String(safe.id) } } // authFetch จะ JSON.stringify ให้เอง
      );
      // sync กับ server
      if (typeof srvLiked !== "undefined") setLiked(!!srvLiked);
      if (typeof srvCount !== "undefined") setLikeCount(Number(srvCount || 0));
    } catch (e) {
      // ถ้าพัง revert กลับ
      setLiked((v) => !v);
      setLikeCount((n) => n + (nextLiked ? -1 : 1));
      console.error("toggle like failed:", e?.message || e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative bg-[#0b0b0d] rounded-2xl overflow-hidden shadow-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="absolute top-3 left-3 z-10">
        {safe.recommended && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500 text-black">
            แนะนำ
          </span>
        )}
      </div>

      {/* ปุ่มหัวใจ */}
      <button
        type="button"
        aria-label={liked ? "ยกเลิกถูกใจ" : "บันทึกถูกใจ"}
        onClick={onToggleLike}
        disabled={!safe.id || busy}
        className={`absolute top-3 right-3 z-10 rounded-full p-2 bg-black/60 backdrop-blur border ${
          liked ? "border-emerald-400" : "border-zinc-600"
        } ${!safe.id || busy ? "opacity-50 cursor-not-allowed" : ""}`}
        title={liked ? "ยกเลิกถูกใจ" : "บันทึกถูกใจ"}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={liked ? "currentColor" : "none"}
          className={liked ? "text-emerald-400" : "text-white"}
        >
          <path
            stroke="currentColor"
            strokeWidth="1.5"
            d="M11.645 20.91l-.105-.1C6.08 16.043 2.75 13.06 2.75 9.5A4.75 4.75 0 017.5 4.75c1.56 0 3.04.74 3.995 1.93A5.12 5.12 0 0115.5 4.75 4.75 4.75 0 0120.25 9.5c0 3.56-3.33 6.543-8.79 11.31l-.105.1-.105-.1z"
          />
        </svg>
      </button>

      {/* รูป */}
      <div
        className={`aspect-[4/3] w-full bg-zinc-900 ${
          canGoDetail ? "cursor-pointer" : "cursor-default"
        }`}
        onClick={goDetail}
      >
        <img
          src={firstImage}
          alt={safe.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* เนื้อหา */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3
            onClick={goDetail}
            className={`text-white text-base font-semibold line-clamp-2 ${
              canGoDetail ? "cursor-pointer hover:text-zinc-200" : "cursor-default"
            }`}
            title={safe.title}
          >
            {safe.title}
          </h3>

          {/* จำนวนรูป / จำนวนถูกใจ */}
          <div className="shrink-0 text-right">
            <div className="text-xs text-zinc-400">
              {safe.photoCount ??
                (Array.isArray(safe.images) ? safe.images.length || 1 : 1)}{" "}
              รูป
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              ♥ {likeCount}
            </div>
          </div>
        </div>

        <div className="text-emerald-400 font-bold">
          ฿{priceText}
          <span className="text-zinc-400 font-medium">
            {safe.priceSuffix || ""}
          </span>
        </div>

        <div className="text-sm text-zinc-300">
          {safe.location || "ไม่ระบุทำเล"}
        </div>

        <div className="mt-2 text-xs text-zinc-400 flex items-center gap-4">
          <span>🛏 {safe.beds}</span>
          <span>🛁 {safe.baths}</span>
          <span>
            📐 {safe.area}
            {safe.areaUnit || "ตร.ม."}
          </span>
        </div>
      </div>
    </div>
  );
}
