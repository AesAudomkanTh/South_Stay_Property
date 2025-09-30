// src/components/Navbar2.jsx
import React, { useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Navbar2.css";
import HamburgerSheet from "./HamburgerSheet";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import NotificationBell from "./NotificationBell";

export default function Navbar2() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [lang, setLang] = useState("th");
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth(); // ✅ ดึง user มาคำนวณสิทธิ์

  // ✅ เช็คสิทธิ์แอดมินจากหลายรูปแบบของข้อมูล
  const userIsAdmin =
    !!user &&
    (
      user?.role === "admin" ||
      (Array.isArray(user?.scopes) && user.scopes.includes("admin")) ||
      (typeof user?.scopes === "string" &&
        user.scopes.split(",").map((s) => s.trim()).includes("admin")) ||
      user?.is_admin === true
    );

  // ปุ่มเมนูเป็น anchor ของ popover
  const menuBtnRef = useRef(null);

  const linkClass = ({ isActive }) =>
    "navlink " +
    (isActive ? "active text-white" : "text-white/80 hover:text-white");

  const onClickPost = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast("โปรดเข้าสู่ระบบก่อนลงประกาศ");
      navigate("/login");
      return;
    }
    navigate("/post");
  };

  // คลิกกระดิ่ง -> ถ้าไม่ล็อกอินพาไปล็อกอิน, ถ้าล็อกอินแล้วพาไปหน้า /chat
  const onClickBell = () => {
    if (!isAuthenticated) {
      toast("โปรดเข้าสู่ระบบเพื่อดูข้อความ");
      navigate("/login");
      return;
    }
    navigate("/chat");
  };

  const openSheet = () => {
    console.debug("[Navbar2] open hamburger sheet");
    setIsSheetOpen(true);
  };
  const closeSheet = () => {
    console.debug("[Navbar2] close hamburger sheet");
    setIsSheetOpen(false);
  };

  return (
    <div className="w-full flex justify-center relative z-[2000] bg-transparent">
      <header className="sticky top-0 z-[2000] mt-3 w-[96%] max-w-6xl rounded-[2rem] bg-black/95 text-white shadow-lg ring-1 ring-white/10 backdrop-blur supports-[backdrop-filter]:bg-black/80">
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-7 py-2">
          {/* ซ้าย: โลโก้ */}
          <div className="justify-self-start navbar-logo">
            <Link to="/" className="inline-flex items-center navbar-logo-link">
              <img src="/Logoo.png" alt="Logo" className="h-6 sm:h-7 w-auto" />
            </Link>
          </div>

          {/* กลาง: ลิงก์เมนู */}
          <nav
            className="menu flex items-center gap-6 sm:gap-10 text-[14px] sm:text-[15px] font-medium"
            role="navigation"
            aria-label="Main"
          >
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/property" className={linkClass}>
              Property
            </NavLink>
            <NavLink to="/about" className={linkClass}>
              About
            </NavLink>
            <NavLink to="/contact" className={linkClass}>
              Contact
            </NavLink>
          </nav>

          {/* ขวา: แอ็กชัน */}
          <div className="justify-self-end flex items-center gap-5 sm:gap-6">
            {/* ✅ ปุ่ม Admin (เฉพาะแอดมิน) — สไตล์/ตำแหน่งเหมือนปุ่มอื่น */}
            {userIsAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="hidden sm:flex flex-col items-center text-white/80 hover:text-white"
                aria-label="Admin dashboard"
                title="Admin"
              >
                <ShieldIcon className="w-5 h-5" />
                <span className="text-[11px] mt-1">Admin</span>
              </button>
            )}

            <a
              href="/post"
              onClick={onClickPost}
              className="hidden sm:flex flex-col items-center text-white/80 hover:text-white"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="text-[11px] mt-1">ลงขาย</span>
            </a>

            {/* วางกระดิ่งตรงนี้ ⬇️ */}
            {/* แสดงเฉพาะตอนล็อกอินแล้ว เพื่อให้ตัวเลข unread ใช้งานได้จริง */}
            {isAuthenticated && (
              <div className="hidden sm:flex flex-col items-center text-white/80 hover:text-white">
                <NotificationBell onClick={onClickBell} />
                <span className="text-[11px] mt-1">ข้อความ</span>
              </div>
            )}

            {/* wrapper ต้องเป็น relative เพื่อให้ popover อ้างอิงได้ */}
            <div className="relative">
              <button
                ref={menuBtnRef}
                onClick={openSheet}
                className="flex flex-col items-center text-white/80 hover:text-white"
                aria-haspopup="dialog"
                aria-expanded={isSheetOpen ? "true" : "false"}
                aria-controls="hamburger-panel"
                aria-label="เปิดเมนู"
              >
                <MenuIcon className="w-5 h-5" />
                <span className="text-[11px] mt-1">เมนู</span>
              </button>

              {/* Popover */}
              <HamburgerSheet
                open={isSheetOpen}
                onClose={closeSheet}
                anchorRef={menuBtnRef}
                theme={theme}
                onToggleTheme={() =>
                  setTheme((t) => (t === "light" ? "dark" : "light"))
                }
                lang={lang}
                onToggleLang={() => setLang((l) => (l === "th" ? "en" : "th"))}
                onLogin={() => navigate("/login")}
                // ✅ ส่งสถานะแอดมิน + ปุ่มไปหน้า Admin ในแผงเมนู
                isAdmin={userIsAdmin}
                onGoAdmin={() => {
                  setIsSheetOpen(false);
                  navigate("/admin");
                }}
              />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

/* --------- ไอคอน ---------- */
function PlusIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function MenuIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ShieldIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
