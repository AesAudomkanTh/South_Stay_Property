// src/components/RequireAuth.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // แจ้งเตือนแล้วพาไปหน้า login
    toast.error("โปรดเข้าสู่ระบบก่อนลงประกาศ");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
