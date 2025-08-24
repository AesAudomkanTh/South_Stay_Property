// Navbar.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="navbar flex items-center justify-between px-6 py-3 bg-white shadow-md">
      <a href="/">
        <img src="/Logo.png" alt="Logo" className="h-10 w-auto" />
      </a>

      <nav className={`menu ${isMenuOpen ? 'open' : ''}`}>

        <a className="nav-link" href="#">Home</a>
        {/* <a className="nav-link" href="#">Property</a> */}
        <NavLink to="/Navbar2" className="nav-link" onClick={closeMenu}>Property</NavLink>
        <a className="nav-link" href="#">About</a>
        <a className="nav-link" href="#">Contact</a>
        <button className="close-menu md-hidden" onClick={closeMenu}>
          <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </nav>

      {/* ---- Actions (right side) ---- */}
      <div className="nav-actions flex items-center gap-3">
        {/* ลงขาย: desktop/tablet (icon + label) */}
        <Link
          to="/sell"
          className="hidden md:flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-2xl text-slate-800 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 transition"
        >
          <PlusIcon className="w-7 h-7" />
          <span className="text-sm font-medium leading-none tracking-wide">ลงขาย</span>
        </Link>

        {/* ลงขาย: mobile (icon only) */}
        <Link
          to="/sell"
          aria-label="ลงขาย"
          className="md:hidden p-2 rounded-xl hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 transition"
        >
          <PlusIcon className="w-6 h-6" />
        </Link>

        {/* Sign up */}
        <Link to="/Login" className="signup-button md-visible">Sign up</Link>

       
      </div>
    </header>
  );
};

export default Navbar;

/* ---- Icons ---- */
function PlusIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
