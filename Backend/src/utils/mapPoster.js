// src/utils/mapPoster.js

/**
 * รวม util เล็ก ๆ สำหรับจัดรูปภาพจาก backend ให้เป็น array<string>
 * รองรับทั้งกรณี:
 * - [{ image_url, ... }]
 * - ["https://..."]
 * - "https://..." เดี่ยว ๆ
 */
export function normalizeImages(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    if (input.length === 0) return [];
    if (typeof input[0] === "string") return input.filter(Boolean);
    // object list
    return input.map(x => x?.image_url || x?.url).filter(Boolean);
  }
  if (typeof input === "string") return [input];
  return [];
}

/**
 * แปลงโพสต์จาก backend → รูปแบบที่การ์ดในหน้า list ใช้
 * ใช้ใน SearchPage.jsx (หรือ Property.jsx) เพื่อเรนเดอร์ PropertyCard
 */
export function mapPosterToCardItem(p = {}) {
  const status = p.status || p.post_status;
  const isActive =
    status === "active" || status === "published" || status === "approve";

  // images อาจมาหลายหน้า
  const images =
    normalizeImages(p.images) ||
    normalizeImages(p.photos) ||
    normalizeImages(p.image_url);

  // โหมด (sale/rent)
  const postType =
    p.post_type || (p.mode ? (p.mode === "rent" ? "rent" : "sale") : "rent");

  // ทำเล/ตำแหน่งสั้น ๆ ไว้โชว์บนการ์ด
  const province =
    p.province || p.location_province || p.address_province || "";
  const location =
    p.location ||
    p.district ||
    p.amphoe ||
    p.address ||
    p.full_address ||
    "";

  // พื้นที่ (ถ้ากรุณีที่ดินให้แปลงเป็น ไร่/ตร.ว. แล้วแต่ดีไซน์)
  const area = p.area ?? p.land_area ?? 0;
  const areaUnit = p.areaUnit || (p.property_type === "land" ? "ไร่" : "ตร.ม.");

  return {
    // ใช้กับ <PropertyCard />
    id: p.post_id || p.id,
    title: p.title || "-",
    images,
    photoCount: Array.isArray(images) ? images.length : 0,

    price: Number(p.price || 0),
    priceSuffix: postType === "rent" ? "/เดือน" : "",

    beds: p.bed_room ?? 0,
    baths: p.bath_room ?? 0,
    area,
    areaUnit,

    type: p.property_type || p.type || "other",
    province,
    location,
    recommended: !!p.recommended, // ถ้าหลังบ้านมี logic แนะนำ
    mode: postType === "rent" ? "rent" : "sale",

    // ไว้กรองทิ้งได้ตอนทำ list
    _statusActive: isActive,
  };
}

/**
 * แปลงโพสต์จาก backend → รูปแบบที่หน้า PropertyDetail ใช้
 * ใช้ใน PropertyDetail.jsx
 */
export function mapPosterToDetail(p = {}, fallbackId = "—") {
  const images =
    normalizeImages(p.images) ||
    normalizeImages(p.photos) ||
    normalizeImages(p.image_url);

  // ข้อมูลผู้ขาย (แนบมาจาก JOIN users)
  const memberTs =
    p.user_created_at ||
    p.userCreatedAt ||
    p.createdByAt ||
    p.u_created_at;

  const seller = {
    name: p.username || p.author || "—",
    memberSince: memberTs
      ? `เป็นสมาชิกเมื่อ ${new Date(memberTs).toLocaleDateString("th-TH")}`
      : "เป็นสมาชิกเมื่อ —",
    phone: p.telephone || p.phone || "",
    avatar:
      p.avatar_url ||
      "https://ui-avatars.com/api/?name=User&background=F1F5F9&color=0F172A&rounded=true",
    profileUrl: "#",
    chatUrl: "#",
  };

  // project/address รองรับชื่อคอลัมน์หลายแบบ
  const project =
    p.project || p.project_name || p.condo_name || p.property_name || "—";

  const address =
    p.address ||
    p.full_address ||
    p.location_text ||
    [p.subdistrict, p.district || p.amphoe, p.province]
      .filter(Boolean)
      .join(" ") ||
    "—";

  return {
    id: p.post_id || p.id || fallbackId,
    title: p.title || "—",
    project,
    address,
    posted: p.created_at
      ? `โพสต์เมื่อ ${new Date(p.created_at).toLocaleDateString("th-TH")}`
      : "โพสต์เมื่อ —",
    price: Number(p.price || 0),

    // สเปกห้อง
    size: p.area ?? p.land_area ?? 0,
    floor: p.floor ?? "—",
    beds: p.bed_room ?? 0,
    baths: p.bath_room ?? 0,
    kitchen: p.kitchen_room ?? 0,
    parking: p.parking ?? 0,

    // ประเภทประกาศ
    purpose: (p.post_type || p.mode) === "rent" ? "เช่า" : "ขาย",

    images,

    // แผนที่
    lat: Number(p.latitude ?? 0) || 13.7563,
    lng: Number(p.longitude ?? 0) || 100.5018,

    seller,

    // รายละเอียด
    detailParagraphs: [
      p.description || "",
      // ถ้าอยากเสริม feasibility ให้โชว์ตอน detail:
      p.feasibility || "",
    ].filter(Boolean),
  };
}

/**
 * ช่วย map รายการ array โพสต์ทีละตัว (เช่นจาก /api/posters)
 */
export function mapPostListToCards(rows = []) {
  return rows.map(mapPosterToCardItem);
}
