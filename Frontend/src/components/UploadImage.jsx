// src/components/UploadImage.jsx
import React, { useState } from "react";

export default function UploadImage({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("กรุณาเลือกไฟล์ก่อน");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5050/api/upload/image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      // ส่ง URL กลับไปให้ Post.jsx ใช้งาน
      onUploaded?.(data.url);
      setFile(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-box">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button type="button" onClick={handleUpload} disabled={loading}>
        {loading ? "กำลังอัปโหลด..." : "อัปโหลด"}
      </button>
    </div>
  );
}
