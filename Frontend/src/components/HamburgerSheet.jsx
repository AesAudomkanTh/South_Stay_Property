// src/components/HamburgerSheet.jsx
import React, { useEffect, useMemo } from "react";
import "./HamburgerSheet.css";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function HamburgerSheet({
  open,
  onClose,
  anchorRef,
  theme,
  onToggleTheme,
  lang,
  onToggleLang,
  onLogin,
  isAdmin,      // (optional) ถ้าส่งมาจะโชว์ปุ่ม Admin
  onGoAdmin,    // (optional) callback ไปหน้า /admin
}) {
  const { user, isAuthenticated, logout } = useAuth();

  // ⛑️ Hook ต้องอยู่ top-level เสมอ (ไม่วางใน if)
  useEffect(() => {
    function handleClickOutside(e) {
      if (!open) return;
      const panel = document.getElementById("hamburger-panel");
      const btn = anchorRef?.current;
      if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, anchorRef]);

  // ค่าที่แสดงผล — คำนวณแบบคงที่ทุกเรนเดอร์ (เรียก useMemo เสมอ)
  const name = useMemo(
    () => (user?.username || user?.first_name_th || "Guest"),
    [user]
  );
  const email = useMemo(() => (user?.email || ""), [user]);
  const verify = useMemo(
    () => user?.verify_status === 1 || user?.verify_status === "verified",
    [user]
  );
  const initials = useMemo(() => {
    const s = (name || "")
      .split(" ")
      .map((x) => x?.[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return s || "U";
  }, [name]);

  // อนุญาต return หลังจาก hook แล้วเท่านั้น
  if (!open) return null;

  return (
    <div className="hamburger-popover" role="dialog" aria-modal="true">
      <div id="hamburger-panel" className="hamburger-panel" style={{ zIndex: 5000 }}>
        <button className="hs-close" aria-label="ปิดเมนู" onClick={onClose}>
          ✕
        </button>

        {/* Header: โปรไฟล์เมื่อ login แล้ว */}
        {isAuthenticated ? (
          <div className="hs-profile" style={{ marginBottom: "0.5rem" }}>
            <div className="hs-avatar" aria-hidden>{initials}</div>
            <div className="hs-info">
              <div className="hs-name">{name}</div>
              {email ? <div className="hs-email">{email}</div> : null}
              <div className={`hs-verify ${verify ? "ok" : "no"}`}>
                {verify ? "ยืนยันตัวตนแล้ว" : "ยังไม่ยืนยันตัวตน"}
              </div>
            </div>
          </div>
        ) : (
          <div className="hs-row hs-row--primary">
            <span>Sign in / Sign up</span>
          </div>
        )}

        <hr className="hs-divider" />

        {/* รายการเมนูเดิม */}
        <div className="hs-list">
          <button type="button" className="hs-item" onClick={onToggleTheme}>
            <span className="hs-item__icon">🌗</span>
            <span>ธีม (Theme)</span>
            <span className="hs-badge">{theme === "dark" ? "มืด" : "สว่าง"}</span>
          </button>

          <button type="button" className="hs-item" onClick={onToggleLang}>
            <span className="hs-item__icon">🌐</span>
            <span>ภาษา (Language)</span>
            <span className="hs-badge">{lang === "th" ? "ไทย" : "EN"}</span>
          </button>

          <Link to="/about" className="hs-item" onClick={onClose}>
            <span className="hs-item__icon">ℹ️</span>
            <span>About</span>
            <span className="hs-arrow">›</span>
          </Link>

          {/* เมนูส่วนตัวเมื่อ login */}
          {isAuthenticated && (
            <>
              <Link to="/property" className="hs-item" onClick={onClose}>
                <span className="hs-item__icon">🏠</span>
                <span>หน้าแรกประกาศทั้งหมด</span>
              </Link>

              <Link to="/post" className="hs-item" onClick={onClose}>
                <span className="hs-item__icon">➕</span>
                <span>ลงประกาศทั้งหมด</span>
              </Link>

              <Link to="/me" className="hs-item" onClick={onClose}>
                <span className="hs-item__icon">👤</span>
                <span>โปรไฟล์ของฉัน</span>
              </Link>

              <Link to="/favorites" className="hs-item" onClick={onClose}>
                <span className="hs-item__icon">❤️</span>
                <span>รายการถูกใจ</span>
              </Link>

              <Link to="/my-posts" className="hs-item" onClick={onClose}>
                <span className="hs-item__icon">🗂️</span>
                <span>ประกาศของฉัน</span>
              </Link>

              {/* ปุ่ม Admin เฉพาะที่เป็นแอดมิน (ไม่ยุ่ง Navbar) */}
              {isAdmin && (
                <button
                  type="button"
                  className="hs-item"
                  onClick={() => {
                    onClose?.();
                    onGoAdmin?.();
                  }}
                >
                  <span className="hs-item__icon">🛡️</span>
                  <span>Admin Dashboard</span>
                  <span className="hs-arrow">›</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* ปุ่มท้าย panel */}
        <div className="hsheet-footer">
          {!isAuthenticated ? (
            <button className="hs-btn primary" onClick={onLogin}>
              เข้าสู่ระบบ / สมัครสมาชิก
            </button>
          ) : (
            <>
              <Link to="/post" className="hs-btn outline" onClick={onClose}>
                + ลงประกาศ
              </Link>
              <button className="hs-btn danger" onClick={logout}>
                ออกจากระบบ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
