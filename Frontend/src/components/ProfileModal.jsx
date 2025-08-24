// src/components/ProfileModal.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";

export default function ProfileModal() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
        <h2 className="text-xl font-bold mb-4">ข้อมูลโปรไฟล์</h2>
        <p><strong>ชื่อผู้ใช้:</strong> {user.username}</p>
        <p><strong>อีเมล:</strong> {user.email}</p>

        {/* TODO: เพิ่มปุ่มแก้ไขข้อมูลภายหลัง */}
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          แก้ไขข้อมูล
        </button>
      </div>
    </div>
  );
}
