import React, { useMemo, useState } from "react";
import "./classifieds.css";

// ---- Mock data (replace with API results) ----
const MOCK_ITEMS = [
  // { id: 1, title: "คอนโดใกล้ BTS", price: 3500000, status: "active", postedAt: "2025-07-20", image: "https://picsum.photos/seed/a/640/480" },
  // { id: 2, title: "บ้านเดี่ยว 60 ตร.ว.", price: 5900000, status: "closed", postedAt: "2025-06-30", image: "https://picsum.photos/seed/b/640/480" },
  // { id: 3, title: "ที่ดิน 1 ไร่", price: 1200000, status: "expired", postedAt: "2025-05-12", image: "https://picsum.photos/seed/c/640/480" },
];

export default function ClassifiedsPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("active"); // active | closed | expired
  const [sort, setSort] = useState({ key: "postedAt", dir: "desc" }); // asc/desc

  const user = { name: "Bosco Bosco" };

  const counts = useMemo(() => ({
    active: MOCK_ITEMS.filter(i => i.status === "active").length,
    closed: MOCK_ITEMS.filter(i => i.status === "closed").length,
    expired: MOCK_ITEMS.filter(i => i.status === "expired").length,
    total: MOCK_ITEMS.length,
  }), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = MOCK_ITEMS.filter(i => i.status === tab);
    if (q) arr = arr.filter(i => i.title.toLowerCase().includes(q));
    arr.sort((a,b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "price") return (a.price - b.price) * dir;
      // postedAt default
      return (new Date(a.postedAt) - new Date(b.postedAt)) * dir;
    });
    return arr;
  }, [query, tab, sort]);

  const initials = useMemo(() => user.name.split(" ").map(s => s[0]).slice(0,2).join("") || "BB", [user.name]);

  return (
    <div className="cls-root">
      <header className="cls-header">
        <div className="cls-user">
          <div className="avatar-circle" aria-hidden>{initials}</div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-sub">สินค้าทั้งหมด {counts.total} ชิ้น</div>
          </div>
        </div>

        <div className="cls-tools">
          <div className="search">
            <span className="icon" aria-hidden>
              <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.5-1.5-5-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"/></svg>
            </span>
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="ค้นหาชื่อประกาศของคุณ"
              aria-label="ค้นหา"
            />
          </div>
          <button
            className="btn sort"
            onClick={() => setSort(s => ({ ...s, dir: s.dir === "asc" ? "desc" : "asc" }))}
            aria-label="เรียงลำดับ"
            title="เรียงลำดับ"
          >
            <svg viewBox="0 0 24 24" aria-hidden><path d="M7 14l-4-4h8l-4 4zm10-4l4 4h-8l4-4z"/></svg>
          </button>
        </div>
      </header>

      <nav className="cls-tabs">
        <button className={tab === "active" ? "tab active" : "tab"} onClick={()=>setTab("active")}>กำลังขาย <span>{counts.active}</span></button>
        <button className={tab === "closed" ? "tab active" : "tab"} onClick={()=>setTab("closed")}>ปิดแล้ว <span>{counts.closed}</span></button>
        <button className={tab === "expired" ? "tab active" : "tab"} onClick={()=>setTab("expired")}>หมดอายุ <span>{counts.expired}</span></button>
      </nav>

      <div className="divider" />

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid">
          {filtered.map((item) => (
            <article key={item.id} className="card">
              <div className="thumb" role="img" aria-label={item.title}>
                <img src={item.image} alt="" />
              </div>
              <h3 className="title" title={item.title}>{item.title}</h3>
              <div className="meta">
                <span className="price">฿{item.price.toLocaleString()}</span>
                <time>{new Date(item.postedAt).toLocaleDateString()}</time>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden>
        <svg viewBox="0 0 24 24"><path d="M21 16V8l-9-5-9 5v8l9 5 9-5ZM5 9.18l7 3.89 7-3.89V9l-7 3.89L5 9v.18Z"/></svg>
        <span>×</span>
      </div>
      <div className="empty-text">ไม่พบสินค้า</div>
    </div>
  );
}