// src/components/Post.jsx
import React, { useState } from "react";
import "./Post.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Post() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // modal แจ้งให้ล็อกอินก่อน
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // --- ฟอร์มหลักตามสคีมา ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [postType, setPostType] = useState("sale"); // 'sale' | 'rent'
  const [propertyType, setPropertyType] = useState("condo"); // 'house' | 'condo' | 'land' | 'other'

  const [price, setPrice] = useState("");

  // optional
  const [bedRoom, setBedRoom] = useState("");
  const [bathRoom, setBathRoom] = useState("");
  const [kitchenRoom, setKitchenRoom] = useState("");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // images: [{ name, image_url }]
  const [images, setImages] = useState([{ name: "", image_url: "" }]);

  // สถานะ UI
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ------- utils -------
  const getToken = () => localStorage.getItem("token") || "";

  const authFetch = async (url, options = {}) => {
    const token = getToken();
    const headers = options.headers ? { ...options.headers } : {};
    headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // debug: request
    console.log("🌐 [DEBUG] Request", {
      url,
      method: options.method || "GET",
      headers,
      body: options.body,
    });

    const res = await fetch(url, { ...options, headers });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    // debug: response
    console.log("📩 [DEBUG] Response", {
      url,
      status: res.status,
      ok: res.ok,
      data,
    });

    if (!res.ok) {
      const msg =
        data?.message ||
        data?.error ||
        (data?.details && JSON.stringify(data.details)) ||
        `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  };

  const requireLoginOrOpenPrompt = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  // ------- handlers: images -------
  const addImageRow = () => {
    if (images.length >= 20) {
      toast.error("รูปภาพได้สูงสุด 20 รายการ");
      return;
    }
    setImages((prev) => [...prev, { name: "", image_url: "" }]);
  };

  const removeImageRow = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateImageField = (idx, key, value) => {
    setImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, [key]: value } : img))
    );
  };

  const isValidUrl = (u) => {
    try {
      const x = new URL(u);
      return !!x.protocol && !!x.host;
    } catch {
      return false;
    }
  };

  // ------- submit -------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requireLoginOrOpenPrompt()) return;

    // validate ฝั่ง FE ให้ตรง schema
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

    // images ต้อง >=1 และ url ถูกต้อง
    const cleanImages = images
      .map((im, i) => ({
        name: im.name?.trim() || `image_${i + 1}`,
        image_url: im.image_url?.trim(),
      }))
      .filter((im) => im.image_url);

    if (cleanImages.length === 0) {
      return toast.error("กรุณาใส่ลิงก์รูปภาพอย่างน้อย 1 รูป");
    }
    if (cleanImages.some((im) => !isValidUrl(im.image_url))) {
      return toast.error("รูปภาพบางรายการ URL ไม่ถูกต้อง");
    }

    // ตัวเลข optional 0..255
    const bed =
      bedRoom === "" ? undefined : Math.max(0, Math.min(255, Number(bedRoom)));
    const bath =
      bathRoom === "" ? undefined : Math.max(0, Math.min(255, Number(bathRoom)));
    const kitchen =
      kitchenRoom === ""
        ? undefined
        : Math.max(0, Math.min(255, Number(kitchenRoom)));

    const payload = {
      title: title.trim(),
      description: description.trim(),
      post_type: postType, // 'sale' | 'rent'
      property_type: propertyType, // 'house' | 'condo' | 'land' | 'other'
      price: Number(price),
      bed_room: bed,
      bath_room: bath,
      kitchen_room: kitchen,
      latitude: lat,
      longitude: lng,
      images: cleanImages, // [{name, image_url}]
    };

    console.log("📤 [DEBUG] payload ที่จะส่งไป backend:", payload);

    try {
      setIsSubmitting(true);

      const res = await authFetch(`${BASE_URL}/api/posters`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log("✅ [DEBUG] สร้างโพสต์สำเร็จ:", res);

      toast.success("โพสต์สำเร็จ 🎉");
      navigate("/property"); // ไปหน้าแสดงโพสต์
    } catch (err) {
      console.error("❌ [DEBUG] error ตอนสร้างโพสต์:", err);
      toast.error(err.message || "บันทึกประกาศไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ปุ่มตัวเลือกเล็กๆ
  const Toggle = ({ on, setOn, leftLabel, rightLabel }) => (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setOn(true)}
        className={`px-4 py-2 rounded-lg font-medium ${
          on ? "bg-black text-white" : "bg-gray-200 text-gray-700"
        }`}
      >
        {leftLabel}
      </button>
      <button
        type="button"
        onClick={() => setOn(false)}
        className={`px-4 py-2 rounded-lg font-medium ${
          !on ? "bg-black text-white" : "bg-gray-200 text-gray-700"
        }`}
      >
        {rightLabel}
      </button>
    </div>
  );

  return (
    <div className="bg-white min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-xl p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">ลงประกาศอสังหาฯ</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* พื้นฐาน */}
          <section className="space-y-6">
            <div>
              <label className="block text-gray-800 font-semibold mb-2">ชื่อประกาศ *</label>
              <input
                type="text"
                placeholder="อย่างน้อย 3 ตัวอักษร"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-800 font-semibold mb-2">รายละเอียด *</label>
              <textarea
                rows={4}
                placeholder="อย่างน้อย 10 ตัวอักษร"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-800 font-semibold mb-2">ขายหรือเช่า *</label>
                <Toggle
                  on={postType === "sale"}
                  setOn={(on) => setPostType(on ? "sale" : "rent")}
                  leftLabel="ขาย"
                  rightLabel="เช่า"
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">ประเภทอสังหา *</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="condo">คอนโด</option>
                  <option value="house">บ้าน</option>
                  <option value="land">ที่ดิน</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-800 font-semibold mb-2">ราคา (บาท) *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
          </section>

          {/* ห้องนอน/น้ำ/ครัว (optional) */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">รายละเอียดห้อง (ไม่บังคับ)</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-800 font-semibold mb-2">ห้องนอน</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={bedRoom}
                  onChange={(e) => setBedRoom(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">ห้องน้ำ</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={bathRoom}
                  onChange={(e) => setBathRoom(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">ห้องครัว</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={kitchenRoom}
                  onChange={(e) => setKitchenRoom(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </section>

          {/* พิกัด */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">พิกัดสถานที่ *</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-800 font-semibold mb-2">Latitude (-90 ถึง 90)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">Longitude (-180 ถึง 180)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </section>

          {/* รูปภาพ (URL) */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">รูปภาพ (ลิงก์ URL) * อย่างน้อย 1 รูป</h2>

            {images.map((im, idx) => (
              <div key={idx} className="grid sm:grid-cols-[1fr_2fr_auto] gap-3 items-center">
                <input
                  type="text"
                  placeholder="ชื่อไฟล์ (ไม่บังคับ)"
                  value={im.name}
                  onChange={(e) => updateImageField(idx, "name", e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="url"
                  placeholder="เช่น https://example.com/image.jpg"
                  value={im.image_url}
                  onChange={(e) => updateImageField(idx, "image_url", e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImageRow(idx)}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white"
                  disabled={images.length === 1}
                  title={images.length === 1 ? "ต้องมีอย่างน้อย 1 รายการ" : "ลบรูปนี้"}
                >
                  ลบ
                </button>
              </div>
            ))}

            <div>
              <button
                type="button"
                onClick={addImageRow}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                + เพิ่มรูป
              </button>
              <p className="text-sm text-gray-500 mt-1">สูงสุด 20 รูป</p>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg bg-black text-white disabled:opacity-60"
            >
              {isSubmitting ? "กำลังบันทึก..." : "ลงประกาศ"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-3 rounded-lg bg-gray-300"
            >
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
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate("/login");
                  toast("โปรดเข้าสู่ระบบก่อนทำรายการ");
                }}
                className="px-4 py-2 rounded-lg bg-black text-white"
              >
                ไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
