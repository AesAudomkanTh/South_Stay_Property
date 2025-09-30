// src/pages/MyPosts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

function useAuthFetch() {
  return async (url, options = {}) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      "";

    // ทำ URL ให้เป็น absolute เสมอ
    const absUrl = /^https?:\/\//i.test(url)
      ? url
      : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

    const isForm = options.body instanceof FormData;
    const headers = new Headers(options.headers || {});
    if (!isForm && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(absUrl, {
      ...options,
      headers,
      credentials: "include",
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      const msg =
        data?.message ||
        data?.error ||
        (data?.details && JSON.stringify(data.details)) ||
        `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  };
}

export default function MyPosts() {
  const authFetch = useAuthFetch();
  const nav = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // edit modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  async function loadMine() {
    try {
      setLoading(true);
      const data = await authFetch(`/api/posters/mine`);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      alert(`โหลดประกาศล้มเหลว: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMine();
  }, []);

  // -------- Delete ----------
  async function handleDelete(id) {
    if (!id) return;
    if (!confirm("ต้องการลบประกาศนี้หรือไม่?")) return;
    try {
      setBusy(true);
      await authFetch(`/api/posters/${id}`, { method: "DELETE" });
      await loadMine();
      alert("ลบประกาศแล้ว");
    } catch (e) {
      alert(`ลบไม่สำเร็จ: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  // -------- Edit ----------
  function openEditModal(post) {
    setEditing({
      post_id: post.post_id,
      title: post.title || "",
      description: post.description || "",
      post_type: post.post_type || "sale",
      property_type: post.property_type || "condo",
      price: Number(post.price || 0),

      bed_room: post.bed_room ?? "",
      bath_room: post.bath_room ?? "",
      kitchen_room: post.kitchen_room ?? "",

      project: post.project || "",
      address: post.address || "",
      province: post.province || "",
      floor: post.floor ?? "",
      parking: post.parking ?? "",
      land_area: post.land_area ?? "",
      feasibility: post.feasibility || "",

      latitude: post.latitude ?? "",
      longitude: post.longitude ?? "",

      currentImages: Array.isArray(post.images) ? post.images : [],
      newImageUrlsText: "",
    });
    setOpenEdit(true);
  }

  async function handleSave() {
    if (!editing) return;
    const payload = {
      title: editing.title?.trim(),
      description: editing.description?.trim(),
      post_type: editing.post_type,
      property_type: editing.property_type,
      price: Number(editing.price),

      bed_room: editing.bed_room === "" ? undefined : Number(editing.bed_room),
      bath_room: editing.bath_room === "" ? undefined : Number(editing.bath_room),
      kitchen_room: editing.kitchen_room === "" ? undefined : Number(editing.kitchen_room),

      project: editing.project?.trim() || undefined,
      address: editing.address?.trim() || undefined,
      province: editing.province?.trim() || undefined,
      floor: editing.floor === "" ? undefined : Number(editing.floor),
      parking: editing.parking === "" ? undefined : Number(editing.parking),
      land_area: editing.land_area === "" ? undefined : Number(editing.land_area),
      feasibility: editing.feasibility?.trim() || undefined,

      latitude: editing.latitude === "" ? undefined : Number(editing.latitude),
      longitude: editing.longitude === "" ? undefined : Number(editing.longitude),
    };
    const urls = editing.newImageUrlsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (urls.length > 0) {
      payload.images = urls.map((u, i) => ({ name: `image_${i + 1}`, image_url: u }));
    }

    try {
      setBusy(true);
      await authFetch(`/api/posters/${editing.post_id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      alert("บันทึกแล้ว (สถานะถูกตั้งเป็นรอตรวจสอบอีกครั้ง)");
      setOpenEdit(false);
      setEditing(null);
      await loadMine();
    } catch (e) {
      alert(`บันทึกไม่สำเร็จ: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  const countByStatus = useMemo(() => {
    const c = { pending: 0, active: 0, rejected: 0, inactive: 0, sold: 0 };
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rows]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-white">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-semibold">ประกาศของฉัน</h1>
        <button
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500"
          onClick={() => nav("/post")}
        >
          + สร้างประกาศใหม่
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          ["pending", "รออนุมัติ"],
          ["active", "แสดงผล"],
          ["rejected", "ถูกปฏิเสธ"],
          ["inactive", "ปิดประกาศ"],
          ["sold", "ขายแล้ว"],
        ].map(([key, label]) => (
          <div key={key} className="bg-[#0b0b0d] border border-zinc-800 rounded-xl p-3 text-center">
            <div className="text-sm text-zinc-400">{label}</div>
            <div className="text-2xl font-bold">{countByStatus[key] || 0}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-zinc-400">กำลังโหลด…</div>
      ) : rows.length === 0 ? (
        <div className="text-zinc-400">ยังไม่มีประกาศของคุณ</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rows.map((p) => (
            <article
              key={p.post_id}
              className="bg-[#0b0b0d] border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <div className="aspect-[4/3] bg-zinc-900">
                <img
                  src={
                    Array.isArray(p.images) && p.images.length
                      ? p.images[0]
                      : "data:image/svg+xml;utf8," +
                        encodeURIComponent(
                          `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
                            <rect width='100%' height='100%' fill='#111' />
                            <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#666' font-size='24'>No Image</text>
                           </svg>`
                        )
                  }
                  alt={p.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold line-clamp-2">{p.title}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      p.status === "active"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : p.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : p.status === "rejected"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-zinc-700 text-zinc-200"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="text-emerald-400 font-bold">
                  ฿{Number(p.price || 0).toLocaleString("th-TH")}
                  <span className="text-zinc-400 font-medium">
                    {p.post_type === "rent" ? "/เดือน" : ""}
                  </span>
                </div>

                <div className="text-sm text-zinc-300 line-clamp-2">
                  {p.address || "-"}
                </div>

                <div className="text-xs text-zinc-400 flex items-center gap-4">
                  <span>🛏 {p.bed_room ?? 0}</span>
                  <span>🛁 {p.bath_room ?? 0}</span>
                  <span>🍳 {p.kitchen_room ?? 0}</span>
                  <span>🚗 {p.parking ?? 0}</span>
                  <span>📐 {p.land_area ?? 0}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                    onClick={() => openEditModal(p)}
                  >
                    แก้ไข
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-60"
                    onClick={() => handleDelete(p.post_id)}
                    disabled={busy}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {openEdit && editing && (
        <div className="fixed inset-0 z-[3000]">
          <div className="absolute inset-0 bg-black/60" onClick={() => !busy && setOpenEdit(false)} />
          <div className="relative mx-auto my-6 max-w-3xl bg-[#0b0b0d] border border-zinc-800 rounded-2xl p-6 overflow-y-auto max-h-[90vh] text-white">
            <h2 className="text-lg font-semibold mb-4">แก้ไขประกาศ</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">ชื่อประกาศ</label>
                <input
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">ราคา (บาท)</label>
                <input
                  type="number"
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2"
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">ขาย/เช่า</label>
                <select
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2"
                  value={editing.post_type}
                  onChange={(e) => setEditing({ ...editing, post_type: e.target.value })}
                >
                  <option value="sale">ขาย</option>
                  <option value="rent">เช่า</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">ประเภท</label>
                <select
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2"
                  value={editing.property_type}
                  onChange={(e) => setEditing({ ...editing, property_type: e.target.value })}
                >
                  <option value="condo">คอนโด</option>
                  <option value="house">บ้าน</option>
                  <option value="land">ที่ดิน</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-1">รายละเอียด</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <NumberInput label="ห้องนอน" value={editing.bed_room}
                onChange={(v) => setEditing({ ...editing, bed_room: v })} />
              <NumberInput label="ห้องน้ำ" value={editing.bath_room}
                onChange={(v) => setEditing({ ...editing, bath_room: v })} />
              <NumberInput label="ห้องครัว" value={editing.kitchen_room}
                onChange={(v) => setEditing({ ...editing, kitchen_room: v })} />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <TextInput label="ชื่อโครงการ" value={editing.project}
                onChange={(v) => setEditing({ ...editing, project: v })} />
              <TextInput label="จังหวัด" value={editing.province}
                onChange={(v) => setEditing({ ...editing, province: v })} />
              <TextInput label="ที่อยู่" value={editing.address}
                onChange={(v) => setEditing({ ...editing, address: v })} textarea />
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <NumberInput label="ชั้น" value={editing.floor}
                onChange={(v) => setEditing({ ...editing, floor: v })} />
              <NumberInput label="ที่จอดรถ (คัน)" value={editing.parking}
                onChange={(v) => setEditing({ ...editing, parking: v })} />
              <NumberInput label="พื้นที่ (ตร.ม.)" step="0.01" value={editing.land_area}
                onChange={(v) => setEditing({ ...editing, land_area: v })} />
            </div>

            <div className="mt-4">
              <TextInput label="Feasibility / หมายเหตุ" value={editing.feasibility}
                onChange={(v) => setEditing({ ...editing, feasibility: v })} textarea />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <NumberInput label="Latitude" step="0.000001" value={editing.latitude}
                onChange={(v) => setEditing({ ...editing, latitude: v })} />
              <NumberInput label="Longitude" step="0.000001" value={editing.longitude}
                onChange={(v) => setEditing({ ...editing, longitude: v })} />
            </div>

            <div className="mt-6">
              <div className="text-sm text-zinc-400 mb-1">รูปปัจจุบัน</div>
              {editing.currentImages?.length ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-2">
                  {editing.currentImages.map((u, i) => (
                    <img key={i} src={u} alt="" className="w-full h-24 object-cover rounded-lg border border-zinc-800" />
                  ))}
                </div>
              ) : (
                <div className="text-zinc-500">— ไม่มีรูป —</div>
              )}

              <label className="block text-sm text-zinc-400 mt-3 mb-1">
                แทนที่รูปทั้งหมด (วาง URL 1 บรรทัดต่อ 1 รายการ — ปล่อยว่างถ้าไม่ต้องการแก้รูป)
              </label>
              <textarea
                rows={4}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2"
                placeholder={"https://...\nhttps://...\n"}
                value={editing.newImageUrlsText}
                onChange={(e) => setEditing({ ...editing, newImageUrlsText: e.target.value })}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600"
                onClick={() => !busy && setOpenEdit(false)}
              >
                ยกเลิก
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                onClick={handleSave}
                disabled={busy}
              >
                {busy ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- small inputs ---------- */
function TextInput({ label, value, onChange, textarea }) {
  const cls = "w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2";
  return (
    <div>
      <label className="block text-sm text-zinc-400 mb-1">{label}</label>
      {textarea ? (
        <textarea className={cls} rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
function NumberInput({ label, value, onChange, step = "1" }) {
  return (
    <div>
      <label className="block text-sm text-zinc-400 mb-1">{label}</label>
      <input
        type="number"
        step={step}
        className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
