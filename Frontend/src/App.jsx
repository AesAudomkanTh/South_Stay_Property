// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar2 from "./components/Navbar2";
import FooterPage from "./components/FooterPage";
import Home from "./components/Home";
import About from "./components/About";
import Contact from "./components/Contact";
import PropertyDetail from "./components/PropertyDetail";
import Post from "./components/Post";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import SignUp from "./components/Signup";

import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./routes/RequireAdmin";
import AdminDashboard from "./Adminn/AdminDashboard";

// ✅ ใช้หน้าแสดงรายการใหม่
import SearchPage from "./components/Search";

// ✅ หน้ารายการถูกใจ
import FavoritesPage from "./pages/FavoritesPage";

// ✅ หน้ารายการประกาศของฉัน
import MyPostsPage from "./pages/MyPostsPage";

// ✅ หน้าแชท
import ChatPage from "./pages/ChatPage";

// ✅ ครอบทั้งแอปด้วย Provider ของแชท (เพื่อให้ NotificationBell / useChat ใช้งานได้)
import ChatSocketProvider from "./context/ChatSocketProvider.jsx";

function NotFound() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-zinc-200">
      ไม่พบหน้าที่คุณต้องการ
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  // กำหนด URL ของ Socket.IO (ถ้าไม่ตั้ง VITE_SOCKET_URL จะ fallback ไปที่ API)
  const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5050";

  return (
    <ChatSocketProvider socketUrl={SOCKET_URL}>
      <Navbar2 />
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        {/* ✅ ใช้ SearchPage เป็นหน้ารายการหลัก */}
        <Route path="/property" element={<SearchPage />} />

        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* ✅ หน้าโพสต์: ต้องล็อกอินก่อน */}
        <Route
          path="/post"
          element={
            <RequireAuth>
              <Post />
            </RequireAuth>
          }
        />

        {/* ✅ แอดมินแดชบอร์ด */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />

        {/* ✅ หน้ารายการประกาศของฉัน */}
        <Route
          path="/my-posts"
          element={
            <RequireAuth>
              <MyPostsPage />
            </RequireAuth>
          }
        />

        {/* ✅ รายการถูกใจ */}
        <Route path="/favorites" element={<FavoritesPage />} />

        {/* ✅ แชท: ต้องล็อกอินก่อน */}
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/signup" element={<SignUp />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <FooterPage />
    </ChatSocketProvider>
  );
}
