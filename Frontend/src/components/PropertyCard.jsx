import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PropertyCard.css";

export default function PropertyCard({
  id,
  title,
  images = [],
  recommended = false,
  posterName = "",
  price = 0,
  priceSuffix = "/เดือน",
  beds = 0,
  baths = 0,
  area = 0,
  areaUnit = "ตร.ม.",
  isFavorite = false,
  onToggleFavorite = () => {},
}) {
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);

  const total = images.length || 1;
  const safeIdx = Math.min(idx, total - 1);
  const img = images[safeIdx] || images[0];

  const goDetail = () => nav(`/property/${id}`, { state: { id, title } });
  const nextImg = (e) => {
    e.stopPropagation();
    if (total > 1) setIdx((i) => (i + 1) % total);
  };
  const toggleFav = (e) => {
    e.stopPropagation();
    onToggleFavorite(id);
  };

  const priceText = useMemo(() => {
    try {
      return new Intl.NumberFormat("th-TH").format(price);
    } catch {
      return price;
    }
  }, [price]);

  return (
  <article
    className="pcard pcard--horizontal"
    onClick={goDetail}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goDetail()}
  >
    {/* ซ้าย: รูป + badge + heart + counter */}
    <div className="pcard__imgwrap">
      {img ? (
        <img className="pcard__img" src={img} alt={title} loading="lazy" />
      ) : (
        <div className="pcard__img placeholder">No image</div>
      )}

      {recommended && (
        <div className="pcard__badge" aria-label="แนะนำ">
          <svg viewBox="0 0 24 24" className="ico" aria-hidden>
            <path d="M12 2l2.1 5.9 6.3.2-4.9 3.6 1.8 5.8L12 14.9 6.7 17.5l1.8-5.8-4.9-3.6 6.3-.2L12 2z"/>
          </svg>
          แนะนำ
        </div>
      )}

      <button
        className={`pcard__heart ${isFavorite ? "active" : ""}`}
        onClick={toggleFav}
        aria-label="บันทึกประกาศนี้"
      >
        <svg viewBox="0 0 24 24" className="ico" aria-hidden>
          <path d="M12 21s-7.2-4.4-9.3-8.5C.8 9.4 2.5 6 5.8 6c2 0 3.3 1.2 4.2 2.4C10.9 7.2 12.2 6 14.2 6c3.3 0 5 3.4 3.1 6.5C19.2 16.6 12 21 12 21z"/>
        </svg>
      </button>

      {total > 1 && (
        <>
          <button className="pcard__nav next" onClick={nextImg} aria-label="รูปถัดไป">
            <svg viewBox="0 0 24 24" className="ico" aria-hidden>
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="pcard__counter" aria-label={`รูปที่ ${safeIdx + 1} จาก ${total}`}>
            {safeIdx + 1} / {total}
          </div>
        </>
      )}
    </div>

    {/* ขวา: รายละเอียดเรียงแนวนอนสวย ๆ */}
    <div className="pcard__content">
      <div>
        <h3 className="pcard__title">{title}</h3>
        <div className="pcard__poster">ลงประกาศโดย {posterName}</div>
      </div>

      <div className="pcard__meta pcard__meta--row">
        <div className="pcard__price">
          <span className="cur">฿</span>
          <span className="num">{priceText}</span>
          <span className="suffix">{priceSuffix}</span>
        </div>

        <div className="pcard__specs pcard__specs--row">
          <div className="spec"><span className="spec__num">{beds}</span><span className="spec__label">ห้องนอน</span></div>
          <div className="sep" />
          <div className="spec"><span className="spec__num">{baths}</span><span className="spec__label">ห้องน้ำ</span></div>
          <div className="sep" />
          <div className="spec"><span className="spec__num">{area}</span><span className="spec__label">{areaUnit}</span></div>
        </div>
      </div>
    </div>
  </article>
);

}
