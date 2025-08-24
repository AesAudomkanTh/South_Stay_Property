import React from 'react'
import Search from './Search'
// import Blog from './Blog'
import Pagination from './Pagination'
import PropertyCard from './PropertyCard'




export default function Property() {
  return (
    <>
      <Search />
      {/* <Blog /> */}
      <PropertyCard />
      <Pagination />
      
     
    </>
  )
}



// import React, { useEffect, useMemo, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import Search from "./Search";
// import PropertyGrid from "./PropertyGrid";
// import Pagination from "./Pagination";
// // import { fetchProperties } from "../services/propertyApi";
// import "./PropertyPage.css";

// export default function Property({ fixedPurpose }){
//   const [sp, setSp] = useSearchParams();
//   const [state, setState] = useState({ items:[], total:0, page:1, pageSize:12, loading:true });

//   const page = Math.max(1, Number(sp.get("page")||1));
//   const pageSize = Math.max(1, Number(sp.get("pageSize")||12));
//   const sort = sp.get("sort") || "newest"; // newest|priceLow|priceHigh

//   // Favorites persisted in localStorage
//   const [favorites, setFavorites] = useState(()=>{
//     try{ return JSON.parse(localStorage.getItem("fav_map")||"{}"); }catch{ return {}; }
//   });
//   useEffect(()=>{ localStorage.setItem("fav_map", JSON.stringify(favorites)); }, [favorites]);

//   const onToggleFavorite = (id)=> setFavorites((m)=> ({ ...m, [id]: !m[id] }));

//   // Build params for API (lock purpose if provided)
//   const params = useMemo(()=>{
//     const obj = Object.fromEntries(sp);
//     obj.page = String(page);
//     obj.pageSize = String(pageSize);
//     obj.sort = sort;
//     if (fixedPurpose) obj.purpose = fixedPurpose;
//     return obj;
//   }, [sp, page, pageSize, sort, fixedPurpose]);

//   useEffect(()=>{
//     let alive = true;
//     setState((s)=>({ ...s, loading:true }));
//     fetchProperties(params).then((data)=>{
//       if(!alive) return;
//       setState({ items:data.items||[], total:data.total||0, page:data.page||page, pageSize:data.pageSize||pageSize, loading:false });
//     }).catch(()=> setState((s)=>({ ...s, loading:false })));
//     return ()=>{ alive=false; };
//   }, [params]);

//   const setSort = (val)=>{
//     const p = new URLSearchParams(Object.fromEntries(sp));
//     p.set("sort", val);
//     p.set("page", "1");
//     setSp(p);
//   };

//   return (
//     <main className="ppage">
//       <Search fixedPurpose={fixedPurpose} />

//       <div className="ppage__bar">
//         <div className="ppage__count">
//           {state.loading ? "กำลังโหลด…" : `${state.total.toLocaleString()} รายการ`}
//         </div>
//         <div className="ppage__sort">
//           <label>
//             เรียงโดย
//             <select value={sort} onChange={(e)=>setSort(e.target.value)}>
//               <option value="newest">ประกาศล่าสุด</option>
//               <option value="priceLow">ราคาต่ำไปสูง</option>
//               <option value="priceHigh">ราคาสูงไปต่ำ</option>
//             </select>
//           </label>
//         </div>
//       </div>

//       {state.loading ? (
//         <div className="ppage__skeleton">
//           {Array.from({length:8}).map((_,i)=> <div key={i} className="ppage__sk" />)}
//         </div>
//       ) : (
//         <PropertyGrid items={state.items} favorites={favorites} onToggleFavorite={onToggleFavorite} />
//       )}

//       <Pagination total={state.total} pageSize={state.pageSize} />
//     </main>
//   );
// }

