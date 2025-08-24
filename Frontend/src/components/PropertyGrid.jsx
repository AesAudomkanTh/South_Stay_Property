// import React from "react";
// import PropertyCard from "./PropertyCard";
// import "./PropertyGrid.css";

// export default function PropertyGrid({ items=[], favorites={}, onToggleFavorite=()=>{} }){
//   if(!items.length){
//     return <div className="pempty">ไม่พบประกาศที่ตรงกับเงื่อนไข</div>;
//   }
//   return (
//     <div className="pgrid">
//       {items.map((it)=> (
//         <PropertyCard
//           key={it.id}
//           id={it.id}
//           title={it.title}
//           images={it.images}
//           recommended={!!it.recommended}
//           posterName={it.posterName||"สมาชิก"}
//           price={it.price}
//           priceSuffix={it.priceSuffix || (it.purpose==="rent"? "/เดือน": "")}
//           beds={it.beds}
//           baths={it.baths}
//           area={it.area}
//           areaUnit={it.areaUnit||"ตร.ม."}
//           isFavorite={!!favorites[it.id]}
//           onToggleFavorite={onToggleFavorite}
//         />
//       ))}
//     </div>
//   );
// }