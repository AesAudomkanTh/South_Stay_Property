// src/components/Post.jsx
import React, { useState, useRef } from "react";
import "./Post.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

/* ---------- helper: authFetch แบบเดียวกับ MyPosts ---------- */
async function authFetch(url, options = {}) {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    "";

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
}

/* ---------- คอมโพเนนต์อัปโหลดรูป (อัปขึ้น backend -> Cloudinary) ---------- */
function UploadImage({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const handlePick = () => inputRef.current?.click();
  const handleFileChange = (e) => setFile(e.target.files?.[0] || null);

  const handleUpload = async () => {
    if (!file) return toast.error("กรุณาเลือกไฟล์ก่อน");
    try {
      setBusy(true);
      const formData = new FormData();
      formData.append("file", file);

      // ใช้ authFetch เพื่อแนบ Authorization ให้ด้วย
      const data = await authFetch(`/api/upload/image`, {
        method: "POST",
        body: formData, // สำคัญ! อย่าตั้ง Content-Type เอง
      });

      if (!data?.url) throw new Error("ไม่พบ url ของรูปที่อัปโหลด");
      onUploaded?.(data.url);
      toast.success("อัปโหลดรูปสำเร็จ");

      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      console.error("[UploadImage] error:", err);
      toast.error(err.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />
      <button type="button" className="btn btn-gray" onClick={handlePick}>
        เลือกไฟล์…
      </button>
      <span className="text-sm text-gray-600">{file ? file.name : "ยังไม่ได้เลือกไฟล์"}</span>
      <button type="button" className="btn btn-red" onClick={handleUpload} disabled={!file || busy}>
        {busy ? "กำลังอัปโหลด..." : "อัปโหลด"}
      </button>
    </div>
  );
}

/* ----------------------------- ฟอร์มโพสต์ ----------------------------- */
export default function Post() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // ฟอร์มหลัก
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [postType, setPostType] = useState("sale");
  const [propertyType, setPropertyType] = useState("condo");
  const [price, setPrice] = useState("");

  const [bedRoom, setBedRoom] = useState("");
  const [bathRoom, setBathRoom] = useState("");
  const [kitchenRoom, setKitchenRoom] = useState("");

  const [project, setProject] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [floor, setFloor] = useState("");
  const [parking, setParking] = useState("");
  const [landArea, setLandArea] = useState("");
  const [feasibility, setFeasibility] = useState("");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // images: [{ name, image_url }]
  const [images, setImages] = useState([{ name: "", image_url: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requireLoginOrOpenPrompt = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  // utils
  const isValidUrl = (u) => {
    try { const x = new URL(u); return !!x.protocol && !!x.host; }
    catch { return false; }
  };

  // เมื่ออัปโหลดรูปเสร็จ -> เติมเข้า images[]
  const handleUploadedUrl = (url) => {
    setImages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last && !last.image_url) {
        next[next.length - 1] = { name: last?.name || "image", image_url: url };
      } else {
        next.push({ name: "image", image_url: url });
      }
      return next.slice(0, 20);
    });
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requireLoginOrOpenPrompt()) return;

    if (!title || title.trim().length < 3) {
      return toast.error("กรุณากรอกชื่อประกาศอย่างน้อย 3 ตัวอักษร");
    }
    if (!description || description.trim().length < 10) {
      return toast.error("รายละเอียดอย่างน้อย 10 ตัวอักษร");
    }
    if (!price || Number(price) < 0) {
      return toast.error("กรุณากรอกราคาให้ถูกต้อง (>= 0)");
    }
    if (latitude === "" || longitude === "") {
      return toast.error("กรุณากรอกพิกัดให้ครบ");
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      return toast.error("Latitude ต้องอยู่ระหว่าง -90 ถึง 90");
    }
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      return toast.error("Longitude ต้องอยู่ระหว่าง -180 ถึง 180");
    }

    // images ต้อง >= 1
    const cleanImages = images
      .map((im, i) => ({
        name: im.name?.trim() || `image_${i + 1}`,
        image_url: im.image_url?.trim(),
      }))
      .filter((im) => im.image_url);

    if (cleanImages.length === 0) {
      return toast.error("กรุณาใส่ลิงก์รูปภาพหรืออัปโหลดอย่างน้อย 1 รูป");
    }
    if (cleanImages.some((im) => !isValidUrl(im.image_url))) {
      return toast.error("รูปภาพบางรายการ URL ไม่ถูกต้อง");
    }

    const bed = bedRoom === "" ? undefined : Math.max(0, Math.min(255, Number(bedRoom)));
    const bath = bathRoom === "" ? undefined : Math.max(0, Math.min(255, Number(bathRoom)));
    const kitchen = kitchenRoom === "" ? undefined : Math.max(0, Math.min(255, Number(kitchenRoom)));
    const floorNum = floor === "" ? undefined : Number(floor);
    const parkingNum = parking === "" ? undefined : Math.max(0, Math.min(255, Number(parking)));
    const areaNum = landArea === "" ? undefined : Number(landArea);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      post_type: postType,
      property_type: propertyType,
      price: Number(price),
      bed_room: bed,
      bath_room: bath,
      kitchen_room: kitchen,
      latitude: lat,
      longitude: lng,
      images: cleanImages,
      project: project?.trim() || undefined,
      address: address?.trim() || undefined,
      province: province?.trim() || undefined,
      floor: Number.isFinite(floorNum) ? floorNum : undefined,
      parking: Number.isFinite(parkingNum) ? parkingNum : undefined,
      land_area: Number.isFinite(areaNum) ? areaNum : undefined,
      feasibility: feasibility?.trim() || undefined,
    };

    try {
      setIsSubmitting(true);
      await authFetch(`/api/posters`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("โพสต์สำเร็จ 🎉");
      navigate("/property");
    } catch (err) {
      console.error("❌ [Post] create error:", err);
      toast.error(err.message || "บันทึกประกาศไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const Toggle = ({ on, setOn, leftLabel, rightLabel }) => (
    <div className="flex gap-2">
      <button type="button" onClick={() => setOn(true)}
        className={`px-4 py-2 rounded-lg font-medium ${on ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}>
        {leftLabel}
      </button>
      <button type="button" onClick={() => setOn(false)}
        className={`px-4 py-2 rounded-lg font-medium ${!on ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}>
        {rightLabel}
      </button>
    </div>
  );

  return (
    <div className="container">
      <div className="card">
        <h1>ลงประกาศอสังหาฯ</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* พื้นฐาน */}
          <section className="space-y-6">
            <div>
              <label>ชื่อประกาศ *</label>
              <input type="text" placeholder="อย่างน้อย 3 ตัวอักษร" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <label>รายละเอียด *</label>
              <textarea rows={4} placeholder="อย่างน้อย 10 ตัวอักษร" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label>ขายหรือเช่า *</label>
                <Toggle on={postType === "sale"} setOn={(on) => setPostType(on ? "sale" : "rent")} leftLabel="ขาย" rightLabel="เช่า" />
              </div>
              <div>
                <label>ประเภทอสังหา *</label>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                  <option value="condo">คอนโด</option>
                  <option value="house">บ้าน</option>
                  <option value="land">ที่ดิน</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
            </div>

            <div>
              <label>ราคา (บาท) *</label>
              <input type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </section>

          {/* ฟิลด์ใหม่ */}
          <section className="space-y-6">
            <h2>ข้อมูลเพิ่มเติม</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label>ชื่อโครงการ</label>
                <input type="text" value={project} onChange={(e) => setProject(e.target.value)} />
              </div>
              <div>
                <label>จังหวัด (ถ้ามีคอลัมน์)</label>
                <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="จังหวัด" />
              </div>
            </div>
            <div>
              <label>ที่อยู่</label>
              <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label>ชั้น (floor)</label>
                <input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} />
              </div>
              <div>
                <label>ที่จอดรถ (คัน)</label>
                <input type="number" min="0" max="255" value={parking} onChange={(e) => setParking(e.target.value)} />
              </div>
              <div>
                <label>พื้นที่ (ตร.ม. หรือ ไร่ สำหรับที่ดิน)</label>
                <input type="number" min="0" step="0.01" value={landArea} onChange={(e) => setLandArea(e.target.value)} placeholder="เช่น 42.5" />
              </div>
            </div>

            <div>
              <label>Feasibility / หมายเหตุ</label>
              <textarea rows={2} value={feasibility} onChange={(e) => setFeasibility(e.target.value)} />
            </div>
          </section>

          {/* รายละเอียดห้อง */}
          <section className="space-y-6">
            <h2>รายละเอียดห้อง (ไม่บังคับ)</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label>ห้องนอน</label>
                <input type="number" min="0" max="255" value={bedRoom} onChange={(e) => setBedRoom(e.target.value)} />
              </div>
              <div>
                <label>ห้องน้ำ</label>
                <input type="number" min="0" max="255" value={bathRoom} onChange={(e) => setBathRoom(e.target.value)} />
              </div>
              <div>
                <label>ห้องครัว</label>
                <input type="number" min="0" max="255" value={kitchenRoom} onChange={(e) => setKitchenRoom(e.target.value)} />
              </div>
            </div>
          </section>

          {/* พิกัด */}
          <section className="space-y-6">
            <h2>พิกัดสถานที่ *</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label>Latitude (-90 ถึง 90)</label>
                <input type="number" step="0.000001" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </div>
              <div>
                <label>Longitude (-180 ถึง 180)</label>
                <input type="number" step="0.000001" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </div>
            </div>
          </section>

          {/* รูปภาพ */}
          <section className="space-y-4">
            <h2>รูปภาพ * (อย่างน้อย 1 รูป)</h2>
            <UploadImage onUploaded={handleUploadedUrl} />
            {images.map((im, idx) => (
              <div key={idx} className="grid sm:grid-cols-[1fr_2fr_auto] gap-3 items-center">
                <input type="text" placeholder="ชื่อไฟล์ (ไม่บังคับ)" value={im.name} onChange={(e) => setImages((prev) =>
                  prev.map((img, i) => (i === idx ? { ...img, name: e.target.value } : img))
                )} />
                <input type="url" placeholder="https://example.com/image.jpg" value={im.image_url} onChange={(e) => setImages((prev) =>
                  prev.map((img, i) => (i === idx ? { ...img, image_url: e.target.value } : img))
                )} />
                <button type="button" onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                  className="btn btn-gray" disabled={images.length === 1}
                  title={images.length === 1 ? "ต้องมีอย่างน้อย 1 รายการ" : "ลบรูปนี้"}>
                  ลบ
                </button>
              </div>
            ))}
            <div>
              <button type="button" onClick={() => setImages((p) => [...p, { name: "", image_url: "" }])} className="btn btn-gray">
                + เพิ่มรูป (ลิงก์ URL)
              </button>
              <p className="text-sm text-gray-500 mt-1">สูงสุด 20 รูป</p>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button type="submit" disabled={isSubmitting} className="btn btn-red">
              {isSubmitting ? "กำลังบันทึก..." : "ลงประกาศ"}
            </button>
            <button type="button" onClick={() => navigate("/")} className="btn btn-gray">
              กลับ
            </button>
          </div>
        </form>
      </div>

      {/* Modal ให้ล็อกอิน */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLoginPrompt(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-[90%] max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">ต้องเข้าสู่ระบบก่อนจึงจะลงประกาศได้</h3>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setShowLoginPrompt(false)} className="btn btn-gray">ยกเลิก</button>
              <button onClick={() => { setShowLoginPrompt(false); navigate("/login"); toast("โปรดเข้าสู่ระบบก่อนทำรายการ"); }} className="btn btn-red">
                ไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
