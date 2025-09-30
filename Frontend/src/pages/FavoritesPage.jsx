// src/pages/FavoritesPage.jsx
import React, { useEffect, useRef, useState } from "react";
import PropertyCard from "../components/PropertyCard";
import { authFetch, API_BASE } from "../utils/authFetch.js";

/** map โพสต์จาก BE -> รูปแบบที่การ์ดใช้งาน */
function mapPosterToCardItem(p) {
  const postType =
    p?.post_type || (p?.mode ? (p.mode === "rent" ? "rent" : "sale") : "rent");

  let imgs = [];
  if (Array.isArray(p?.images) && p.images.length) {
    imgs = p.images.map((im) => (typeof im === "string" ? im : im?.image_url)).filter(Boolean);
  } else if (Array.isArray(p?.photos) && p.photos.length) {
    imgs = p.photos.map((im) => (typeof im === "string" ? im : im?.image_url)).filter(Boolean);
  } else if (p?.image_url) {
    imgs = [p.image_url];
  }

  return {
    id: p?.post_id || p?.id,
    title: p?.title || "-",
    images: imgs,
    photoCount: imgs.length,
    price: Number(p?.price || 0),
    priceSuffix: postType === "rent" ? "/เดือน" : "",
    beds: p?.bed_room ?? 0,
    baths: p?.bath_room ?? 0,
    area: p?.area ?? p?.land_area ?? 0,
    areaUnit: p?.areaUnit || (p?.property_type === "land" ? "ไร่" : "ตร.ม."),
    type: p?.property_type || p?.type || "other",
    province: p?.province || p?.location_province || "",
    location: p?.location || p?.district || p?.amphoe || "",
    recommended: false,
    mode: postType === "rent" ? "rent" : "sale",
  };
}

export default function FavoritesPage() {
  const [likedIds, setLikedIds] = useState([]);   // ['post_xxx', ...]
  const [items, setItems] = useState([]);         // โพสต์ที่ถูกใจจริง ๆ
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(null);

  // 1) โหลดรายการโพสต์ที่กดถูกใจ (เฉพาะ id) จากเซิร์ฟเวอร์
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        // ✅ backend ส่ง { ids: [...] }
        const { ids } = await authFetch(`${API_BASE}/api/likes/mine`);
        if (!alive) return;
        setLikedIds((ids || []).map(String));   // normalize เป็น string
      } catch (e) {
        if (!alive) return;
        console.error("[FavoritesPage] load liked ids error:", e);
        setLikedIds([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // 2) ตามด้วยโหลดรายละเอียดโพสต์เฉพาะไอดีพวกนี้เท่านั้น
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;

    if (!likedIds?.length) {
      setItems([]);
      return () => ctl.abort();
    }

    (async () => {
      try {
        setLoading(true);

        // พยายามยิงแบบ batch ถ้าคุณมี endpoint: GET /api/posters?ids=a,b,c
        // ไม่มีก็จะ fallback ไปดึงทีละโพสต์
        let posts = [];
        try {
          const batch = await authFetch(
            `${API_BASE}/api/posters?ids=${encodeURIComponent(likedIds.join(","))}`,
            { signal: ctl.signal }
          );
          posts = Array.isArray(batch) ? batch : batch.items || batch.data || [];
        } catch {
          const results = await Promise.allSettled(
            likedIds.map((id) =>
              authFetch(`${API_BASE}/api/posters/${encodeURIComponent(id)}`, { signal: ctl.signal })
            )
          );
          posts = results
            .filter((r) => r.status === "fulfilled" && r.value)
            .map((r) => r.value);
        }

        const mapped = posts
          .map(mapPosterToCardItem)
          .filter((x) => x.id && likedIds.includes(String(x.id)));

        setItems(mapped);
      } catch (e) {
        if (e?.name !== "AbortError") {
          console.error("[FavoritesPage] load posts error:", e);
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ctl.abort();
  }, [likedIds]);

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mt-6 mb-4">
          <h2 className="text-lg font-semibold">รายการถูกใจ</h2>
        </div>

        {!loading && items.length === 0 && (
          <div className="text-zinc-400">ยังไม่มีประกาศที่ถูกใจ</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {!loading && items.map((p) => <PropertyCard key={String(p.id)} item={p} />)}
          {loading && <div className="text-zinc-400">กำลังโหลด…</div>}
        </div>
      </section>
    </div>
  );
}
