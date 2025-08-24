import React, { useMemo, useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import "./PropertyDetail.css";

export default function PropertyDetail() {
  const { id } = useParams();
  const location = useLocation();

  // Add/remove a body class so the whole page goes black while here
  useEffect(() => {
    document.body.classList.add("pd2-body-dark");
    return () => document.body.classList.remove("pd2-body-dark");
  }, []);

  // ----- Mock data (แทน API ชั่วคราว) -----
  const base = {
    id: id || "RE-2025-0001",
    title: "ให้เช่าคอนโดกลางใจเมือง ประตูน้ำ",
    project: "เดอะ แพลทตินั่ม (The Platinum)",
    address: "644 ถนน เพชรบุรี แขวง ถนนพญาไท เขตราชเทวี กรุงเทพฯ 10400",
    posted: "โพสต์เมื่อ 4 วันที่ผ่านมา",
    price: 19000,
    size: 42,
    floor: 16,
    beds: 1,
    baths: 1,
    parking: 1,
    purpose: "เช่า",
    images: [
      "https://www.168tobedesign.co.th/wp-content/uploads/2025/07/%E0%B8%99%E0%B8%B1%E0%B9%88%E0%B8%87%E0%B9%80%E0%B8%A5%E0%B9%88%E0%B8%99%E0%B9%84%E0%B8%94%E0%B8%99%E0%B9%8C%E0%B8%99%E0%B8%B4%E0%B9%88%E0%B8%87-3.jpg",
      "https://www.168tobedesign.co.th/wp-content/uploads/2025/08/4.2-scaled.jpg",
      "https://www.168tobedesign.co.th/wp-content/uploads/2025/06/%E0%B8%AB%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B8%99%E0%B8%AD%E0%B8%99%E0%B9%83%E0%B8%AB%E0%B8%8D%E0%B9%88walkin1.jpg",
      "https://i.pinimg.com/736x/46/48/3e/46483e261de02e743b4c3cfb912a8992.jpg","https://hba-th.org/images/Wise-Fremtiden.png"
    ],
    lat: 13.7507,
    lng: 100.5412,
    seller: {
      name: "Songpol Insuwanno",
      memberSince: "เป็นสมาชิกเมื่อ 9 ส.ค. 2568",
      phone: "099-242-5262",
      avatar:
        "https://ui-avatars.com/api/?name=%E0%B8%93%E0%B8%93&background=F1F5F9&color=0F172A&rounded=true",
      profileUrl: "#",
      chatUrl: "#",
    },
    detailParagraphs: [
      "ประกาศ ให้เช่า คอนโดพลทตินั่ม อยู่ตึกเดียวกับแพลทตินั่มแฟชั่นมอลล์ ทำเลศูนย์กลางเมือง",
      "ห้องขนาด 42 ตรม. ตามรูป พร้อมเข้าอยู่ เพิ่มทาสี เปลี่ยนพื้น และเตียงใหม่ รวมที่จอดรถ 1 คัน",
      "สอบถามเพิ่มเติม ติดต่อไลน์ ID: Mollyholm และ โทร: 099-242-5262",
    ],
  };

  // รวม state จากหน้ารายการ (ถ้ามี) เพื่อให้ชื่อ/รูปปกตรงกัน
  const data = useMemo(() => {
    const s = location.state || {};
    return {
      ...base,
      id: s.id || base.id,
      title: s.title || base.title,
      images: s.image ? [s.image, ...(base.images || [])] : base.images,
    };
  }, [location.state, id]); // รวม id ใน dependency เผื่อ route เปลี่ยน

  // ทำให้มั่นใจว่ามีรูปอย่างน้อย 1 รูป
  const imagesArr =
    Array.isArray(data.images) && data.images.length
      ? data.images
      : [
          "https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?q=60&auto=format&fit=crop&w=1600",
        ];

  // แกลเลอรี
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    // ถ้าจำนวนรูปเปลี่ยน ให้รีเซ็ต index ให้อยู่ในช่วง
    setActiveIndex((i) => Math.min(i, imagesArr.length - 1));
  }, [imagesArr.length]);

  const activeImg = imagesArr[activeIndex];

  const fmtPrice = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(data.price);

  return (
    <main className="pd2 pd2--dark">
      {/* ส่วนหัว */}
      <header className="pd2-head">
        <div className="pd2-head-left">
          <h1 className="pd2-title">{data.title}</h1>
          <div className="pd2-price">{fmtPrice}</div>
          <div className="pd2-posted">{data.posted}</div>
        </div>

        <div className="pd2-actions">
          <button className="pd2-iconbtn" aria-label="like">❤</button>
          <button className="pd2-iconbtn" aria-label="share">↗</button>
        </div>
      </header>

      {/* แกลเลอรีรูป */}
      <section className="pd-gallery" aria-label="แกลเลอรี">
        <figure className="pd-hero">
          <img src={activeImg} alt={`ภาพ ${activeIndex + 1} ของ ${data.title}`} />
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

      {/* คอลัมน์ซ้าย (ข้อมูล) + ขวา (ผู้ขาย) */}
      <section className="pd2-top">
        {/* ซ้าย */}
        <div className="pd2-info">
          <div className="pd2-card">
            <ul className="pd2-spec">
              <li>
                <span className="pd2-spec-ic">🏢</span>
                <div>
                  <div className="pd2-spec-h">ชื่อโครงการ</div>
                  <div className="pd2-spec-t">{data.project}</div>
                </div>
              </li>
              <li>
                <span className="pd2-spec-ic">📍</span>
                <div>
                  <div className="pd2-spec-h">ที่อยู่</div>
                  <div className="pd2-spec-t">{data.address}</div>
                </div>
              </li>
            </ul>

            <hr className="pd2-sep" />

            <div className="pd2-facts">
              <Fact label="ขนาดห้อง" value={`${data.size} ตรม`} icon="📐" />
              <Fact label="ชั้น" value={data.floor} icon="🧱" />
              <Fact label="ห้องนอน" value={data.beds} icon="🛏️" />
              <Fact label="ห้องน้ำ" value={data.baths} icon="🚿" />
              <Fact label="ที่จอดรถ" value={data.parking} icon="🚗" />
              <Fact label="ประเภท" value={data.purpose} icon="🏷️" />
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
                src={`https://www.google.com/maps?q=${data.lat},${data.lng}&z=16&output=embed`}
              />
            </div>
          </div>

          {/* รายละเอียด */}
          <div className="pd2-card">
            <h2 className="pd2-h2">รายละเอียด</h2>
            {data.detailParagraphs.map((p, i) => (
              <p key={i} className="pd2-p">{p}</p>
            ))}
          </div>

          {/* สินค้าใกล้เคียง (ตัวอย่าง) */}
          <div className="pd2-card">
            <h2 className="pd2-h2">สินค้าใกล้เคียง</h2>
            <div className="pd2-similar">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <a className="pd2-sim" href="#" key={i}>
                  <div className="pd2-sim-img" />
                  <div className="pd2-sim-t">ให้เช่าคอนโดใกล้…</div>
                  <div className="pd2-sim-p">฿19,000</div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ขวา: การ์ดผู้ขาย */}
        <aside className="pd2-seller" aria-label="ติดต่อผู้ขาย">
          <div className="pd2-seller-card">
            <div className="pd2-seller-head">
              <div className="pd2-avatar">
                <img src={data.seller.avatar} alt="" />
              </div>
              <div className="pd2-seller-lines">
                <div className="pd2-seller-title">รายละเอียดผู้ขาย</div>
                <div className="pd2-seller-name">{data.seller.name}</div>
                <div className="pd2-seller-meta">{data.seller.memberSince}</div>
              </div>
            </div>

            <a className="pd2-btn block" href={data.seller.chatUrl}>
              <span className="pd2-btn-ic">💬</span> แชท
            </a>

            <div className="pd2-row2">
              <a className="pd2-btn outline" href={`tel:${data.seller.phone.replace(/\D/g, "")}`}>
                <span className="pd2-btn-ic">📞</span> โทร
              </a>
              <a className="pd2-btn outline" href={data.seller.profileUrl}>
                <span className="pd2-btn-ic">👤</span> โปรไฟล์
              </a>
            </div>

            <form
              className="pd2-form"
              onSubmit={(e) => {
                e.preventDefault();
                alert("ส่งข้อความถึงผู้ขายเรียบร้อย!");
              }}
            >
              <label>
                ชื่อ–สกุล
                <input type="text" required placeholder="ชื่อของคุณ" />
              </label>
              <label>
                เบอร์โทร
                <input type="tel" required placeholder="08x-xxx-xxxx" />
              </label>
              <label>
                ข้อความ
                <textarea rows="3" placeholder="สนใจนัดดูห้องได้เมื่อไรคะ/ครับ?" />
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
