import React, { useMemo, useState } from "react";
import "./search.css";

export default function SearchPage() {
 
  const [mode, setMode] = useState("rent"); 
  const [query, setQuery] = useState(""); 
  const [propertyType, setPropertyType] = useState(""); 
  const [province, setProvince] = useState("");
  const [unitSize, setUnitSize] = useState(""); 
  const [unitType, setUnitType] = useState("sqm"); 
  const [maxPrice, setMaxPrice] = useState("");

  
  const params = useMemo(() => ({
    mode,
    q: query.trim() || undefined,
    propertyType: propertyType || undefined,
    province: province.trim() || undefined,
    unit: unitSize ? { size: Number(unitSize), type: unitType } : undefined,
    maxPrice: maxPrice ? Number(String(maxPrice).replace(/[, ]/g, "")) : undefined,
  }), [mode, query, propertyType, province, unitSize, unitType, maxPrice]);

  const onSubmit = (e) => {
    e.preventDefault();
    console.log("SEARCH params", params);
    alert("ค้นหา:" + JSON.stringify(params, null, 2));
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

  return (
    <div className="sr-root">
      <form className="sr-panel" onSubmit={onSubmit}>
        
        <div className="segmented" role="tablist" aria-label="โหมดประกาศ">
          <button type="button" role="tab" aria-selected={mode === "rent"} className={mode === "rent" ? "seg active" : "seg"} onClick={() => setMode("rent")}>เช่า</button>
          <button type="button" role="tab" aria-selected={mode === "sale"} className={mode === "sale" ? "seg active" : "seg"} onClick={() => setMode("sale")}>ขาย</button>
        </div><br />

        
        <div className="sr-row">
  <label className="search" aria-label="ค้นหา">
    <span className="icon" aria-hidden>
      <svg viewBox="0 0 24 24">
        <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 9.5 16c1.6 0 3.08-.58 4.23-1.57l.27.28v.79l5 5 1.5-1.5-5-5ZM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z"/>
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
              <select value={propertyType} onChange={(e)=>setPropertyType(e.target.value)} aria-label="เลือกประเภท">
                <option value="">ทั้งหมด</option>
                <option value="house">บ้าน</option>
                <option value="condo">คอนโด</option>
                <option value="land">ที่ดิน</option>
              </select>
            </div>
          </div>

          <div className="select">
            <label>จังหวัด</label>
            <div className="pill-select">
               <select value={province} onChange={(e)=>setProvince(e.target.value)} aria-label="เลือกประเภท">
                <option value="">ทั้งหมด</option>
                <option value="กระบี่">กระบี่</option>
                <option value="ชุมพร">ชุมพร</option>
                <option value="ตรัง">ตรัง</option>
                <option value="นครศรีธรรมราช">นครศรีธรรมราช</option>
                <option value="นราธิวาส">นราธิวาส</option>
                <option value="ปัตตานี">ปัตตานี</option>
                <option value="พังงา">พังงา</option>
                <option value="พัทลุง">พัทลุง</option>
                <option value="ภูเก็ต">ภูเก็ต</option>
                <option value="ระนอง">ระนอง</option>
                <option value="สงขลา">สงขลา</option>
                <option value="สตูล">สตูล</option>
                <option value="สุราษฎร์ธานี">สุราษฎร์ธานี</option>
                <option value="ยะลา">ยะลา</option>
              </select>
            </div>
          </div>
        </div>

        
        <div className="sr-row-2">
          <div className="select">
            <label>ขนาดยูนิต</label>
            <div className="unit-input">
              <input inputMode="numeric" value={unitSize} onChange={(e)=>setUnitSize(e.target.value)} placeholder="เช่น 50" aria-label="ขนาด" />
              <select value={unitType} onChange={(e)=>setUnitType(e.target.value)} aria-label="หน่วย">
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
              <input inputMode="numeric" placeholder="เช่น 5,000,000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} aria-label="ราคาไม่เกิน" />
              <span className="suffix">฿</span>
            </div>
          </div>
        </div>

        <div className="sr-actions">
          <button className="btn primary" type="submit">ค้นหา</button>
          <button type="button" className="btn ghost" onClick={reset}>ล้างตัวกรอง</button>
        </div>
      </form>
    </div>
  );
}


// import React, { useMemo, useState, useEffect } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import "./Search.css";

// const PURPOSES = [
//   { key: "all", label: "ทั้งหมด" },
//   { key: "buy", label: "ซื้อ" },
//   { key: "rent", label: "เช่า" },
// ];

// const TYPES = [
//   { key: "", label: "ทุกประเภท" },
//   { key: "condo", label: "คอนโด" },
//   { key: "house", label: "บ้านเดี่ยว" },
//   { key: "townhouse", label: "ทาวน์เฮาส์" },
//   { key: "land", label: "ที่ดิน" },
// ];

// export default function Search({ fixedPurpose }) {
//   const [sp, setSp] = useSearchParams();
//   const nav = useNavigate();

//   // read from URL but allow lock via fixedPurpose
//   const urlPurpose = sp.get("purpose") || "all";
//   const purpose = fixedPurpose || urlPurpose; // lock if provided
//   const type = sp.get("type") || "";
//   const q = sp.get("q") || "";
//   const province = sp.get("province") || "";
//   const minPrice = sp.get("minPrice") || "";
//   const maxPrice = sp.get("maxPrice") || "";
//   const beds = sp.get("beds") || "";
//   const baths = sp.get("baths") || "";

//   const [local, setLocal] = useState({ purpose, type, q, province, minPrice, maxPrice, beds, baths });

//   // keep local state in sync with URL or lock value
//   useEffect(() => {
//     setLocal({
//       purpose: fixedPurpose || urlPurpose,
//       type, q, province, minPrice, maxPrice, beds, baths,
//     });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fixedPurpose, urlPurpose, type, q, province, minPrice, maxPrice, beds, baths]);

//   const updateField = (k) => (e) => setLocal((s) => ({ ...s, [k]: e.target.value }));

//   const submit = (e) => {
//     e.preventDefault();
//     const params = new URLSearchParams({ ...Object.fromEntries(sp) });
//     // write cleaned params
//     Object.entries(local).forEach(([k, v]) => {
//       if (k === "purpose") return; // handle below
//       if (v === undefined || v === null || String(v).trim() === "") params.delete(k);
//       else params.set(k, v);
//     });
//     // enforce purpose when fixed; otherwise omit when "all"
//     if (fixedPurpose) {
//       params.set("purpose", fixedPurpose);
//     } else if (local.purpose === "all") {
//       params.delete("purpose");
//     } else {
//       params.set("purpose", local.purpose);
//     }

//     params.set("page", "1"); // reset page
//     setSp(params);
//     nav(`/property?${params.toString()}`);
//   };

//   const clearAll = () => {
//     const params = new URLSearchParams();
//     if (fixedPurpose) params.set("purpose", fixedPurpose);
//     setSp(params);
//     nav(`/property${fixedPurpose ? `?purpose=${fixedPurpose}` : ""}`);
//   };

//   const purposeLabel = PURPOSES.find((p)=>p.key===purpose)?.label || "ทั้งหมด";

//   return (
//     <section className="search">
//       {/* Tabs hidden if fixedPurpose; show a small chip instead */}
//       {!fixedPurpose ? (
//         <div className="search__tabs" role="tablist" aria-label="Purpose">
//           {PURPOSES.map((p) => (
//             <button
//               key={p.key}
//               className={`search__tab ${local.purpose === p.key ? "active" : ""}`}
//               role="tab"
//               aria-selected={local.purpose === p.key}
//               onClick={() => setLocal((s) => ({ ...s, purpose: p.key }))}
//             >
//               {p.label}
//             </button>
//           ))}
//         </div>
//       ) : (
//         <div className="search__tabs" aria-label="Purpose">
//           <span className="chip">โหมด: {purposeLabel}</span>
//         </div>
//       )}

//       <form className="search__form" onSubmit={submit}>
//         {/* row 1 */}
//         <div className="search__row">
//           <label className="f">
//             <span className="f__label">ประเภท</span>
//             <select className="f__input" value={local.type} onChange={updateField("type")}> 
//               {TYPES.map((t) => (
//                 <option key={t.key} value={t.key}>{t.label}</option>
//               ))}
//             </select>
//           </label>

//           <label className="f">
//             <span className="f__label">ทำเล / จังหวัด</span>
//             <input className="f__input" placeholder="กรุงเทพฯ, เชียงใหม่…" value={local.province} onChange={updateField("province")} />
//           </label>

//           <label className="f f--sm">
//             <span className="f__label">ห้องนอน</span>
//             <select className="f__input" value={local.beds} onChange={updateField("beds")}>
//               <option value="">ทั้งหมด</option>
//               {[0,1,2,3,4,5].map((n)=> <option key={n} value={n}>{n}+</option>)}
//             </select>
//           </label>

//           <label className="f f--sm">
//             <span className="f__label">ห้องน้ำ</span>
//             <select className="f__input" value={local.baths} onChange={updateField("baths")}>
//               <option value="">ทั้งหมด</option>
//               {[0,1,2,3,4,5].map((n)=> <option key={n} value={n}>{n}+</option>)}
//             </select>
//           </label>
//         </div>

//         {/* row 2 */}
//         <div className="search__row">
//           <label className="f">
//             <span className="f__label">ราคาต่ำสุด (฿)</span>
//             <input className="f__input" type="number" inputMode="numeric" min={0} value={local.minPrice} onChange={updateField("minPrice")} />
//           </label>
//           <label className="f">
//             <span className="f__label">ราคาสูงสุด (฿)</span>
//             <input className="f__input" type="number" inputMode="numeric" min={0} value={local.maxPrice} onChange={updateField("maxPrice")} />
//           </label>

//           <label className="f f--grow">
//             <span className="f__label">คำค้นหา</span>
//             <input className="f__input" placeholder="ชื่อโครงการ / ทำเล / รหัสประกาศ" value={local.q} onChange={updateField("q")} />
//           </label>

//           <div className="search__actions">
//             <button type="submit" className="btn btn--primary">ค้นหา</button>
//             <button type="button" className="btn" onClick={clearAll}>ล้าง</button>
//           </div>
//         </div>
//       </form>
//     </section>
//   );
// }

