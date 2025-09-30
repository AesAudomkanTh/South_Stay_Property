// src/pages/SearchPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropertyCard from "../components/PropertyCard";
import "./search.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

// ── helpers ───────────────────────────────────────────────────────────────────
const toStr = (v) => (typeof v === "string" ? v : v == null ? "" : String(v));
const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export default function SearchPage() {
  // ====== ฟอร์ม ======
  const [mode, setMode] = useState("rent");
  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [province, setProvince] = useState("");
  const [unitSize, setUnitSize] = useState("");
  const [unitType, setUnitType] = useState("sqm");
  const [maxPrice, setMaxPrice] = useState("");

  const params = useMemo(
    () => ({
      mode,
      q: toStr(query).trim() || undefined,
      propertyType: toStr(propertyType) || undefined,
      province: toStr(province).trim() || undefined,
      unit: unitSize ? { size: toNum(unitSize), type: unitType } : undefined,
      maxPrice: toStr(maxPrice)
        ? Number(toStr(maxPrice).replace(/[, ]/g, ""))
        : undefined,
    }),
    [mode, query, propertyType, province, unitSize, unitType, maxPrice]
  );

  const onSubmit = (e) => {
    e.preventDefault();
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
  };

  const reset = () => {
    setMode("rent");
    setQuery("");
    setPropertyType("");
    setProvince("");
    setUnitSize("");
    setUnitType("sqm");
    setMaxPrice("");
  };

  // ====== ดึงข้อมูลจาก Backend ======
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef(null);
  const controllerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function mapPosterToCardItem(p) {
    const status = p?.status || p?.post_status;
    const isActive =
      status === "active" || status === "published" || status === "approve";
    const postType =
      p?.post_type || (p?.mode ? (p.mode === "rent" ? "rent" : "sale") : "rent");

    const images =
      Array.isArray(p?.images) && p.images.length
        ? p.images
        : Array.isArray(p?.photos) && p.photos.length
        ? p.photos
        : p?.image_url
        ? [p.image_url]
        : [];

    return {
      id: p?.post_id || p?.id,
      title: toStr(p?.title || "-"),
      images,
      photoCount: images.length,
      price: toNum(p?.price, 0),
      priceSuffix: postType === "rent" ? "/เดือน" : "",
      beds: toNum(p?.bed_room, 0),
      baths: toNum(p?.bath_room, 0),
      area: toNum(p?.area ?? p?.land_area, 0),
      areaUnit: toStr(p?.areaUnit || (p?.property_type === "land" ? "ไร่" : "ตร.ม.")),
      type: toStr(p?.property_type || p?.type || "other"),
      province: toStr(p?.province || p?.location_province),
      location: toStr(p?.location || p?.district || p?.amphoe),
      recommended: false,
      mode: postType === "rent" ? "rent" : "sale",
      _statusActive: isActive,
    };
  }

  async function fetchActivePosts() {
    if (controllerRef.current) controllerRef.current.abort();
    const ctl = new AbortController();
    controllerRef.current = ctl;

    try {
      setLoading(true);

      const url = `${BASE_URL}/api/posters?status=active`;
      const res = await fetch(url, { signal: ctl.signal });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      const data = text ? JSON.parse(text) : [];
      const list = Array.isArray(data)
        ? data
        : data.items || data.posts || data.data || [];

      const mapped = list
        .map(mapPosterToCardItem)
        .filter((x) => x._statusActive && x.id);

      if (mountedRef.current && !ctl.signal.aborted) {
        setItems(mapped);
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error("[SearchPage] fetchActivePosts error:", e);
        try {
          const ctl2 = new AbortController();
          controllerRef.current = ctl2;

          const res2 = await fetch(`${BASE_URL}/api/posters`, { signal: ctl2.signal });
          const text2 = await res2.text();
          if (!res2.ok) throw new Error(text2 || `HTTP ${res2.status}`);

          const data2 = text2 ? JSON.parse(text2) : [];
          const list2 = Array.isArray(data2)
            ? data2
            : data2.items || data2.posts || data2.data || [];

          const mapped2 = list2
            .map(mapPosterToCardItem)
            .filter((x) => x._statusActive && x.id);

          if (mountedRef.current && !ctl2.signal.aborted) setItems(mapped2);
        } catch (e2) {
          if (e2?.name !== "AbortError") {
            console.error("[SearchPage] fallback error:", e2);
            if (mountedRef.current) setItems([]);
          }
        }
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    fetchActivePosts();
    timerRef.current = setInterval(fetchActivePosts, 20000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  // ====== กรองตามค่าฟอร์ม (กัน undefined ทุกจุด) ======
  const filtered = useMemo(() => {
    const q = toStr(params.q).toLowerCase();
    const maxP = params.maxPrice;

    return items.filter((p) => {
      if (toStr(p.mode) !== toStr(mode)) return false;
      if (toStr(propertyType) && toStr(p.type) !== toStr(propertyType)) return false;

      const prov = toStr(p.province);
      if (toStr(province) && !prov.includes(toStr(province))) return false;

      if (typeof maxP === "number" && Number.isFinite(maxP) && p.price > maxP) return false;

      if (q) {
        const hay = `${toStr(p.title)} ${toStr(p.location)} ${toStr(p.province)} ${toStr(
          p.type
        )}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (params.unit?.size && toNum(p.area, 0) < Number(params.unit.size)) return false;

      return true;
    });
  }, [items, mode, propertyType, province, params]);

  // ====== ถูกใจ (ถ้ายังไม่ได้ย้ายไป FavoritesContext) ======
  const [likes, setLikes] = useState(() => new Set());
  const toggleLike = (id) =>
    setLikes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="bg-black text-white min-h-screen">
      {/* ฟอร์มค้นหา */}
      <div className="sr-root">
        <form className="sr-panel" onSubmit={onSubmit}>
          <div className="segmented" role="tablist" aria-label="โหมดประกาศ">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "rent"}
              className={mode === "rent" ? "seg active" : "seg"}
              onClick={() => setMode("rent")}
            >
              เช่า
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "sale"}
              className={mode === "sale" ? "seg active" : "seg"}
              onClick={() => setMode("sale")}
            >
              ขาย
            </button>
          </div>
          <br />

          <div className="sr-row">
            <label className="search" aria-label="ค้นหา">
              <span className="icon" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 9.5 16c1.6 0 3.08-.58 4.23-1.57l.27.28v.79l5 5 1.5-1.5-5-5ZM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z" />
                </svg>
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหา โครงการคอนโด ทำเล, จังหวัด, และอื่นๆ"
                aria-label="ค้นหา"
              />
            </label>
          </div>

          <div className="sr-row-2">
            <div className="select">
              <label>ประเภท</label>
              <div className="pill-select">
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  aria-label="เลือกประเภท"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="house">บ้าน</option>
                  <option value="condo">คอนโด</option>
                  <option value="land">ที่ดิน</option>
                  <option value="office">ออฟฟิศ</option>
                </select>
              </div>
            </div>

            <div className="select">
              <label>จังหวัด</label>
              <div className="pill-select">
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  aria-label="เลือกจังหวัด"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="กรุงเทพฯ">กรุงเทพฯ</option>
                  <option value="นนทบุรี">นนทบุรี</option>
                  <option value="ภูเก็ต">ภูเก็ต</option>
                  <option value="สงขลา">สงขลา</option>
                  <option value="นครศรีธรรมราช">นครศรีธรรมราช</option>
                </select>
              </div>
            </div>
          </div>

          <div className="sr-row-2">
            <div className="select">
              <label>ขนาดยูนิต</label>
              <div className="unit-input">
                <input
                  inputMode="numeric"
                  value={unitSize}
                  onChange={(e) => setUnitSize(e.target.value)}
                  placeholder="เช่น 50"
                  aria-label="ขนาด"
                />
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  aria-label="หน่วย"
                >
                  <option value="sqm">ตร.ม.</option>
                  <option value="sqw">ตร.ว.</option>
                  <option value="rai">ไร่</option>
                </select>
              </div>
            </div>

            <div className="select">
              <label>ราคา</label>
              <div className="chip-input">
                <span className="prefix">ไม่เกิน</span>
                <input
                  inputMode="numeric"
                  placeholder="เช่น 5,000,000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  aria-label="ราคาไม่เกิน"
                />
                <span className="suffix">฿</span>
              </div>
            </div>
          </div>

          <div className="sr-actions">
            <button className="btn primary" type="submit">
              ค้นหา
            </button>
            <button type="button" className="btn ghost" onClick={reset}>
              ล้างตัวกรอง
            </button>
            <button
              type="button"
              className="btn outline"
              onClick={fetchActivePosts}
              title="รีเฟรชรายการล่าสุด"
            >
              รีเฟรช
            </button>
          </div>
        </form>
      </div>

      {/* ====== ผลลัพธ์ ====== */}
      <section
        id="results"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16"
      >
        <div className="flex items-center justify-between mt-6 mb-4">
          <h2 className="text-lg font-semibold">
            {mode === "rent" ? "คอนโด/บ้านให้เช่า" : "คอนโด/บ้านประกาศขาย"}
          </h2>
          <div className="text-sm text-zinc-400">
            {loading ? "กำลังโหลด…" : `${filtered.length} รายการ`}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {!loading &&
            filtered.map((p) => (
              <PropertyCard
                key={p.id}
                item={p}
                liked={false /* ถ้ายังไม่เชื่อม FavoritesContext */}
                onToggleLike={() => {}}
              />
            ))}
          {loading && <div className="text-zinc-400">กำลังโหลดประกาศ…</div>}
          {!loading && filtered.length === 0 && (
            <div className="text-zinc-400">ไม่พบประกาศที่ตรงกับเงื่อนไข</div>
          )}
        </div>
      </section>
    </div>
  );
}
