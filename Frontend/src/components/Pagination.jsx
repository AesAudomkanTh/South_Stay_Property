import React from 'react';
import './Pagination.css';

export default function Pagination() {
  return (
    <div className="pagination-container">
      <button type="button" aria-label="prev" className="pagination-arrow">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.499 12.85a.9.9 0 0 1 .57.205l.067.06a.9.9 0 0 1 .06 1.206l-.06.066-5.585 5.586-.028.027.028.027 5.585 5.587a.9.9 0 0 1 .06 1.207l-.06.066a.9.9 0 0 1-1.207.06l-.066-.06-6.25-6.25a1 1 0 0 1-.158-.212l-.038-.08a.9.9 0 0 1-.03-.606l.03-.083a1 1 0 0 1 .137-.226l.06-.066 6.25-6.25a.9.9 0 0 1 .635-.263Z" fill="#475569" stroke="#475569" strokeWidth=".078"/>
        </svg>
      </button>

      <div className="pagination-numbers">
        <button className="page-number current">1</button>
        <button className="page-number">2</button>
        <button className="page-number">3</button>
        <button className="page-number">4</button>
        <button className="page-number">5</button>
      </div>

      <button type="button" aria-label="next" className="pagination-arrow">
        <svg className="rotate-180" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.499 12.85a.9.9 0 0 1 .57.205l.067.06a.9.9 0 0 1 .06 1.206l-.06.066-5.585 5.586-.028.027.028.027 5.585 5.587a.9.9 0 0 1 .06 1.207l-.06.066a.9.9 0 0 1-1.207.06l-.066-.06-6.25-6.25a1 1 0 0 1-.158-.212l-.038-.08a.9.9 0 0 1-.03-.606l.03-.083a1 1 0 0 1 .137-.226l.06-.066 6.25-6.25a.9.9 0 0 1 .635-.263Z" fill="#475569" stroke="#475569" strokeWidth=".078"/>
        </svg>
      </button>
    </div>
  );
}

// import React from "react";
// import { useSearchParams } from "react-router-dom";
// import "./Pagination.css";

// export default function Pagination({ total = 0, pageSize = 12, maxVisible = 5 }) {
//   const [sp, setSp] = useSearchParams();
//   const page = Math.max(1, Number(sp.get("page") || 1));
//   const totalPages = Math.max(1, Math.ceil(total / pageSize));

//   const go = (p) => {
//     const clamped = Math.min(Math.max(1, p), totalPages);
//     const params = new URLSearchParams(Object.fromEntries(sp));
//     params.set("page", String(clamped));
//     setSp(params);
//   };

//   if (totalPages <= 1) return null;

//   let start = Math.max(1, page - Math.floor(maxVisible / 2));
//   let end = Math.min(totalPages, start + maxVisible - 1);
//   start = Math.max(1, end - maxVisible + 1);
//   const pages = [];
//   for (let p = start; p <= end; p++) pages.push(p);

//   const Arrow = ({ dir }) => (
//     <svg className={dir === "next" ? "rotate-180" : ""} width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
//       <path d="M22.499 12.85a.9.9 0 0 1 .57.205l.067.06a.9.9 0 0 1 .06 1.206l-.06.066-5.585 5.586-.028.027.028.027 5.585 5.587a.9.9 0 0 1 .06 1.207l-.06.066a.9.9 0 0 1-1.207.06l-.066-.06-6.25-6.25a1 1 0 0 1-.158-.212l-.038-.08a.9.9 0 0 1-.03-.606l.03-.083a1 1 0 0 1 .137-.226l.06-.066 6.25-6.25a.9.9 0 0 1 .635-.263Z" fill="#475569" stroke="#475569" strokeWidth=".078"/>
//     </svg>
//   );

//   return (
//     <div className="pagination-container" role="navigation" aria-label="pagination">
//       <button type="button" aria-label="prev" className="pagination-arrow" onClick={() => go(page - 1)} disabled={page <= 1}>
//         <Arrow dir="prev" />
//       </button>

//       <div className="pagination-numbers">
//         {start > 1 && (
//           <>
//             <button className="page-number" onClick={() => go(1)}>1</button>
//             {start > 2 && <span className="pagination-ellipsis">…</span>}
//           </>
//         )}

//         {pages.map((p) => (
//           <button
//             key={p}
//             className={`page-number ${p === page ? "current" : ""}`}
//             onClick={() => go(p)}
//             aria-current={p === page ? "page" : undefined}
//           >
//             {p}
//           </button>
//         ))}

//         {end < totalPages && (
//           <>
//             {end < totalPages - 1 && <span className="pagination-ellipsis">…</span>}
//             <button className="page-number" onClick={() => go(totalPages)}>{totalPages}</button>
//           </>
//         )}
//       </div>

//       <button type="button" aria-label="next" className="pagination-arrow rotate-180" onClick={() => go(page + 1)} disabled={page >= totalPages}>
//         <Arrow dir="next" />
//       </button>
//     </div>
//   );
// }