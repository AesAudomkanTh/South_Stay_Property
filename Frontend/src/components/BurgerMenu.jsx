import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./BurgerMenu.css";

export default function BurgerMenu({
  user = { name: "Bosco Bosco", credit: 0, avatarUrl: "" },
  onLogout = () => alert("ออกจากระบบ"),
  // ⬇️ เพิ่ม props สำหรับโหมด controlled
  open: controlledOpen,
  onClose,
  onOpen,
  hideTopbar = false, // ⬅️ ซ่อน topbar ภายใน component ถ้าเราใช้ปุ่มจาก Navbar
}) {
  // ถ้าไม่ส่ง open เข้ามา ให้มี state ภายในใช้เอง (uncontrolled)
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen : internalOpen;

  const sheetRef = useRef(null);
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("th");

  const setOpen = (val) => {
    if (isControlled) {
      if (val) onOpen && onOpen();
      else onClose && onClose();
    } else {
      setInternalOpen(val);
    }
  };

  // Close on ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (open && sheetRef.current && !sheetRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const initials = user.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      {/* ถ้าอยากใช้ปุ่มภายใน BurgerMenu เองให้ซ่อน false */}
      {!hideTopbar && (
        <header className="topbar">
          <div className="topbar-inner">
            <button className="add-btn" aria-label="ลงขาย" title="ลงขาย">
              <PlusIcon />
            </button>
            <div className="brand">ลงขาย</div>
            <button
              className="burger-btn"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls="menu-sheet"
              onClick={() => setOpen(true)}
              title="เมนู"
            >
              <BurgerIcon />
              <span className="burger-label">เมนู</span>
            </button>
          </div>
        </header>
      )}

      {/* Overlay + Sheet */}
      {open && (
        <div className="sheet-overlay" role="presentation">
          <section
            id="menu-sheet"
            className="sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="เมนูผู้ใช้"
          >
            {/* Header */}
            <div className="sheet-header">
              <div className="avatar">
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} /> : <span>{initials}</span>}
              </div>
              <div className="user-lines">
                <h2>{user.name}</h2>
                <p>เครดิต: <strong>{user.credit}</strong></p>
              </div>
              <button className="close-x" aria-label="ปิดเมนู" onClick={() => setOpen(false)}>×</button>
            </div>

            <hr className="divider" />

            {/* Actions */}
            <nav className="menu-list">
              <Link to="/chat" className="menu-item" onClick={() => setOpen(false)}>
                <IconHolder><ChatIcon /></IconHolder><span className="label">แชท</span>
              </Link>

              <Link to="/my-posts" className="menu-item" onClick={() => setOpen(false)}>
                <IconHolder><PostIcon /></IconHolder><span className="label">ประกาศของฉัน</span>
              </Link>

              <Link to="/favorites" className="menu-item selected" onClick={() => setOpen(false)}>
                <IconHolder><HeartIcon /></IconHolder><span className="label">ถูกใจ</span>
              </Link>

              <Link to="/credits" className="menu-item" onClick={() => setOpen(false)}>
                <IconHolder><CreditIcon /></IconHolder><span className="label">ซื้อเครดิต</span>
              </Link>

              <Link to="/profile" className="menu-item" onClick={() => setOpen(false)}>
                <IconHolder><UserIcon /></IconHolder><span className="label">แก้ไขโปรไฟล์</span>
              </Link>

              {/* Theme row */}
              <button className="menu-item as-button" onClick={() => setTheme(t => (t === "light" ? "dark" : "light"))}>
                <IconHolder><PaletteIcon /></IconHolder>
                <span className="label">โหมดสี</span>
                <span className="value">{theme === "light" ? "สว่าง" : "มืด"}</span>
              </button>

              {/* Language row */}
              <button className="menu-item as-button" onClick={() => setLang(l => (l === "th" ? "en" : "th"))}>
                <IconHolder><LangIcon /></IconHolder>
                <span className="label">ภาษา</span>
                <span className="value">{lang === "th" ? "ไทย" : "English"}</span>
              </button>

              <hr className="divider" />

              <button className="menu-item danger as-button" onClick={() => { onLogout(); setOpen(false); }}>
                <IconHolder><LogoutIcon /></IconHolder>
                <span className="label">ออกจากระบบ</span>
              </button>
            </nav>
          </section>
        </div>
      )}
    </>
  );
}

/* ---------- Small helpers & inline SVG icons ---------- */
function IconHolder({ children }) { return <span className="icon-holder">{children}</span>; }
function BurgerIcon() { return (<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>); }
function PlusIcon() { return (<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>); }
function ChatIcon() { return (<svg viewBox="0 0 24 24" aria-hidden><path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M4 5h16v11a2 2 0 0 1-2 2H9l-5 3V7a2 2 0 0 1 2-2Z" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.2" /></svg>); }
function PostIcon() { return (<svg viewBox="0 0 24 24" aria-hidden><path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>); }
function HeartIcon() { return (<svg viewBox="0 0 24 24" aria-hidden><path d="M12.1 20s-7.6-4.3-9.1-9.2C1.9 7.7 3.9 5 6.7 5c1.6 0 2.9.9 3.6 2.2C11 5.9 12.4 5 14 5c2.8 0 4.8 2.7 3.7 5.8-1.5 4.9-9.6 9.2-9.6 9.2z" fill="currentColor" /></svg>); }
function CreditIcon() { return (<svg viewBox="0 0 24 24" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="1.6" fill="none" /><path d="M3 9h18" stroke="currentColor" strokeWidth="1.6" /><circle cx="8" cy="14" r="1.5" fill="currentColor" /><circle cx="12" cy="14" r="1.5" fill="currentColor" /></svg>); }
function UserIcon() { return (<svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" fill="none" /><path d="M4 20c1.8-3.5 5-5 8-5s6.2 1.5 8 5" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>); }
function PaletteIcon() { return (<svg viewBox="0 0 24 24" aria-hidden><path d="M12 3a9 9 0 1 0 0 18c2 0 2-1 2-2s0-2 2-2h1a3 3 0 0 0 0-6 9 9 0 0 0-5-8Z" fill="currentColor" opacity="0.08" /><circle cx="7.5" cy="10" r="1.3" fill="currentColor" /><circle cx="10.5" cy="7.5" r="1.3" fill="currentColor" /><circle cx="14" cy="8.5" r="1.3" fill="currentColor" /><circle cx="16" cy="12" r="1.3" fill="currentColor" /></svg>); }
function LangIcon() { return (<svg viewBox="0 0 24 24" aria-hidden><path d="M3 5h8l-2 4h6L13 19" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /><path d="M15 5h6M18 5v12M15 17h6" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function LogoutIcon() { return (<svg viewBox="0 0 24 24" aria-hidden><path d="M15 12H7M12 8l-4 4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M17 3h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>); }
