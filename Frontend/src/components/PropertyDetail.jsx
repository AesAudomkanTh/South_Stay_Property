// src/components/PropertyDetail.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./PropertyDetail.css";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

/* ---------- mapper: แปลงรูปแบบ backend -> โครงที่หน้า detail ใช้ ---------- */
function mapPosterToDetail(p, fallbackId) {
  // รองรับทั้ง images: string[] และ images: {image_url:string}[]
  const imgs =
    Array.isArray(p?.images) && p.images.length
      ? p.images
          .map((im) => (typeof im === "string" ? im : im?.image_url))
          .filter(Boolean)
      : Array.isArray(p?.photos) && p.photos.length
      ? p.photos
      : p?.image_url
      ? [p.image_url]
      : [];

  // วันสมัครสมาชิก (จาก join query: user_created_at)
  const memberTs =
    p?.user_created_at ||
    p?.userCreatedAt ||
    p?.createdByAt ||
    p?.u_created_at;

  // ผู้ขาย
  const seller = {
    id: p?.user_id || p?.seller_id || null, // ✅ เอามาใช้เปิดแชท
    name: p?.username || p?.author || "—",
    memberSince: memberTs
      ? `เป็นสมาชิกเมื่อ ${new Date(memberTs).toLocaleDateString("th-TH")}`
      : "เป็นสมาชิกเมื่อ —",
    phone: p?.telephone || p?.phone || "",
    avatar:
      p?.avatar_url ||
      "https://ui-avatars.com/api/?name=User&background=F1F5F9&color=0F172A&rounded=true",
    profileUrl: "#",
  };

  // ชื่อโครงการ / ที่อยู่
  const project =
    p?.project || p?.project_name || p?.condo_name || p?.property_name || "—";

  const address =
    p?.address ||
    p?.full_address ||
    p?.location_text ||
    [p?.province, p?.district, p?.subdistrict].filter(Boolean).join(" ") ||
    "—";

  return {
    id: p?.post_id || p?.id || fallbackId || "—",
    title: p?.title || "—",
    project,
    address,
    posted: p?.created_at
      ? `โพสต์เมื่อ ${new Date(p.created_at).toLocaleDateString("th-TH")}`
      : "โพสต์เมื่อ —",
    price: Number(p?.price || 0),
    size: p?.area ?? p?.land_area ?? 0,
    floor: p?.floor ?? "—",
    beds: p?.bed_room ?? 0,
    baths: p?.bath_room ?? 0,
    kitchen: p?.kitchen_room ?? 0,
    parking: p?.parking ?? 0,
    purpose: (p?.post_type || p?.mode) === "rent" ? "เช่า" : "ขาย",
    images: imgs,
    lat: Number(p?.latitude ?? 0) || 13.7563,
    lng: Number(p?.longitude ?? 0) || 100.5018,
    seller,
    detailParagraphs:
      Array.isArray(p?.detailParagraphs) && p.detailParagraphs.length
        ? p.detailParagraphs
        : [p?.description || "—"].filter(Boolean),
  };
}

/* ---------- auth fetch (แนบ token อัตโนมัติ) ---------- */
async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token") || "";
  const headers = options.headers ? { ...options.headers } : {};
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }
  return data;
}

export default function PropertyDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // ให้ทั้งหน้ามืด (ธีม) ตอนอยู่ในหน้านี้
  useEffect(() => {
    document.body.classList.add("pd2-body-dark");
    return () => document.body.classList.remove("pd2-body-dark");
  }, []);

  // Initial จาก state ที่ส่งมาจากหน้ารายการ (กรณีเปิดจากการ์ด)
  const initialFromList = useMemo(() => {
    const s = location.state || {};
    return {
      id: id || s.id || "—",
      title: s.title || "กำลังโหลด…",
      project: "—",
      address: "—",
      posted: "",
      price: Number(s.price || 0),
      size: s.area ?? 0,
      floor: "—",
      beds: s.beds ?? 0,
      baths: s.baths ?? 0,
      kitchen: s.kitchen ?? 0,
      parking: 0,
      purpose: s.mode === "rent" ? "เช่า" : s.mode === "sale" ? "ขาย" : "—",
      images: s.image ? [s.image] : [],
      lat: 13.7563,
      lng: 100.5018,
      seller: {
        id: null,
        name: "—",
        memberSince: "เป็นสมาชิกเมื่อ —",
        phone: "",
        avatar:
          "https://ui-avatars.com/api/?name=User&background=F1F5F9&color=0F172A&rounded=true",
        profileUrl: "#",
      },
      detailParagraphs: [],
    };
  }, [location.state, id]);

  const [detail, setDetail] = useState(initialFromList);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ฟอร์มติดต่อผู้ขาย
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactText, setContactText] = useState("");

  // โหลดข้อมูลจริงจาก backend
  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${BASE_URL}/api/posters/${id}`);
        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

        const data = text ? JSON.parse(text) : null;
        const poster = Array.isArray(data) ? data[0] : data;
        const mapped = mapPosterToDetail(poster || {}, id);

        if (!cancelled) {
          setDetail((prev) => ({
            ...mapped,
            // ถ้ารูปจาก backend ไม่มี ให้คงรูปจาก state เดิมที่มากับลิสต์
            images: mapped.images?.length ? mapped.images : prev.images,
          }));
        }
      } catch (e) {
        console.error("[PropertyDetail] load error:", e);
        if (!cancelled) {
          setError("ไม่พบประกาศ หรือเกิดข้อผิดพลาดในการโหลดข้อมูล");
          setDetail((prev) => ({ ...initialFromList, id }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) loadDetail();
    return () => {
      cancelled = true;
    };
  }, [id, initialFromList]);

  // แกลเลอรีรูป
  const imagesArr =
    Array.isArray(detail.images) && detail.images.length
      ? detail.images
      : [
          "https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?q=60&auto=format&fit=crop&w=1600",
        ];

  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, imagesArr.length - 1));
  }, [imagesArr.length]);

  const activeImg = imagesArr[activeIndex];

  const fmtPrice = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(detail.price || 0);

  /* ---------- actions: chat & send message ---------- */
  const goLogin = (msg) => {
    toast(msg || "โปรดเข้าสู่ระบบก่อนทำรายการ");
    navigate("/login");
  };

  const handleClickChat = () => {
    if (!isAuthenticated) return goLogin("โปรดเข้าสู่ระบบเพื่อแชทกับผู้ขาย");
    if (!detail?.seller?.id) return toast.error("ไม่พบผู้ขายของประกาศนี้");
    navigate(`/chat?peer=${encodeURIComponent(detail.seller.id)}`);
  };

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return goLogin("โปรดเข้าสู่ระบบเพื่อส่งข้อความ");
    if (!detail?.seller?.id) return toast.error("ไม่พบผู้ขายของประกาศนี้");

    const pieces = [];
    if (contactName) pieces.push(`ผู้ติดต่อ: ${contactName}`);
    if (contactPhone) pieces.push(`เบอร์: ${contactPhone}`);
    if (contactText) pieces.push(contactText);
    const text =
      `สนใจประกาศ: ${detail.title} (ID: ${detail.id})\n` + pieces.join("\n");

    try {
      await authFetch(`${BASE_URL}/api/chat/dm`, {
        method: "POST",
        body: JSON.stringify({ to_user_id: detail.seller.id, text }),
      });
      toast.success("ส่งข้อความถึงผู้ขายแล้ว");
      setContactName("");
      setContactPhone("");
      setContactText("");
      navigate(`/chat?peer=${encodeURIComponent(detail.seller.id)}`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "ส่งข้อความไม่สำเร็จ");
    }
  };

  return (
    <main className="pd2 pd2--dark">
      {/* ส่วนหัว */}
      <header className="pd2-head">
        <div className="pd2-head-left">
          <h1 className="pd2-title">
            {loading ? "กำลังโหลด…" : detail.title || "—"}
          </h1>
          <div className="pd2-price">{fmtPrice}</div>
          <div className="pd2-posted">{detail.posted || " "}</div>
          {error && <div className="pd2-error">{error}</div>}
        </div>

        <div className="pd2-actions">
          <button className="pd2-iconbtn" aria-label="like">❤</button>
          <button className="pd2-iconbtn" aria-label="share">↗</button>
        </div>
      </header>

      {/* แกลเลอรีรูป */}
      <section className="pd-gallery" aria-label="แกลเลอรี">
        <figure className="pd-hero">
          <img src={activeImg} alt={`ภาพ ${activeIndex + 1} ของ ${detail.title || ""}`} />
          {loading && <div className="pd2-loading">กำลังโหลดรูป…</div>}
        </figure>
        <div className="pd-thumbs">
          {imagesArr.map((src, i) => (
            <button
              key={`${src}-${i}`}
              className={`pd-thumb ${i === activeIndex ? "active" : ""}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`ดูภาพที่ ${i + 1}`}
              type="button"
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      </section>

      {/* คอลัมน์ซ้าย/ขวา */}
      <section className="pd2-top">
        {/* ซ้าย: รายละเอียดหลัก */}
        <div className="pd2-info">
          <div className="pd2-card">
            <ul className="pd2-spec">
              <li>
                <span className="pd2-spec-ic">🏢</span>
                <div>
                  <div className="pd2-spec-h">ชื่อโครงการ</div>
                  <div className="pd2-spec-t">{detail.project || "—"}</div>
                </div>
              </li>
              <li>
                <span className="pd2-spec-ic">📍</span>
                <div>
                  <div className="pd2-spec-h">ที่อยู่</div>
                  <div className="pd2-spec-t">{detail.address || "—"}</div>
                </div>
              </li>
            </ul>

            <hr className="pd2-sep" />

            <div className="pd2-facts">
              <Fact label="ขนาดห้อง" value={`${detail.size || 0} ตรม`} icon="📐" />
              <Fact label="ชั้น" value={detail.floor ?? "—"} icon="🧱" />
              <Fact label="ห้องนอน" value={detail.beds ?? 0} icon="🛏️" />
              <Fact label="ห้องน้ำ" value={detail.baths ?? 0} icon="🚿" />
              <Fact label="ห้องครัว" value={detail.kitchen ?? 0} icon="🍳" />
              <Fact label="ที่จอดรถ" value={detail.parking ?? 0} icon="🚗" />
              <Fact label="ประเภท" value={detail.purpose || "—"} icon="🏷️" />
            </div>
          </div>

          {/* แผนที่ */}
          <div className="pd2-card">
            <h2 className="pd2-h2">แผนที่</h2>
            <div className="pd2-map">
              <iframe
                title="map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${detail.lat},${detail.lng}&z=16&output=embed`}
              />
            </div>
          </div>

          {/* รายละเอียดเพิ่มเติม */}
          <div className="pd2-card">
            <h2 className="pd2-h2">รายละเอียด</h2>
            {(detail.detailParagraphs?.length ? detail.detailParagraphs : ["—"]).map((p, i) => (
              <p key={i} className="pd2-p">{p}</p>
            ))}
          </div>
        </div>

        {/* ขวา: ผู้ขาย */}
        <aside className="pd2-seller" aria-label="ติดต่อผู้ขาย">
          <div className="pd2-seller-card">
            <div className="pd2-seller-head">
              <div className="pd2-avatar">
                <img src={detail.seller.avatar} alt="" />
              </div>
              <div className="pd2-seller-lines">
                <div className="pd2-seller-title">รายละเอียดผู้ขาย</div>
                <div className="pd2-seller-name">{detail.seller.name}</div>
                <div className="pd2-seller-meta">{detail.seller.memberSince}</div>
              </div>
            </div>

            {/* ปุ่มแชท: ต้องล็อกอินก่อน */}
            <button className="pd2-btn block" type="button" onClick={handleClickChat}>
              <span className="pd2-btn-ic">💬</span> แชท
            </button>

            <div className="pd2-row2">
              <a
                className="pd2-btn outline"
                href={detail.seller.phone ? `tel:${detail.seller.phone.replace(/\D/g, "")}` : "#"}
              >
                <span className="pd2-btn-ic">📞</span> โทร
              </a>
              <a className="pd2-btn outline" href={detail.seller.profileUrl}>
                <span className="pd2-btn-ic">👤</span> โปรไฟล์
              </a>
            </div>

            {/* ฟอร์มส่งข้อความแบบรวดเร็ว -> DM */}
            <form className="pd2-form" onSubmit={handleSubmitMessage}>
              <label>
                ชื่อ–สกุล
                <input
                  type="text"
                  placeholder="ชื่อของคุณ"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </label>
              <label>
                เบอร์โทร
                <input
                  type="tel"
                  placeholder="08x-xxx-xxxx"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                />
              </label>
              <label>
                ข้อความ
                <textarea
                  rows="3"
                  placeholder="สนใจนัดดูห้องได้เมื่อไรคะ/ครับ?"
                  value={contactText}
                  onChange={(e) => setContactText(e.target.value)}
                />
              </label>
              <button className="pd2-btn primary block" type="submit">
                ส่งข้อความ
              </button>
            </form>
          </div>
        </aside>
      </section>
    </main>
  );
}

/* ---------- helper ---------- */
function Fact({ label, value, icon }) {
  return (
    <div className="pd2-fact">
      <span className="pd2-fact-ic" aria-hidden>{icon}</span>
      <div className="pd2-fact-lines">
        <div className="pd2-fact-h">{label}</div>
        <div className="pd2-fact-v">{value}</div>
      </div>
    </div>
  );
}
