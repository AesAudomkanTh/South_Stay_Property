// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Navbar2 from "./components/Navbar2";
import FooterPage from "./components/FooterPage";
import Home from "./components/Home";
import About from "./components/About";
import Contact from "./components/Contact";
import Property from "./components/Property";
import PropertyDetail from "./components/PropertyDetail";
import Post from "./components/Post";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import SignUp from "./components/Signup";

import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./routes/RequireAdmin";          // ✅
import AdminDashboard from "./Adminn/AdminDashboard";       // ✅ default import

export default function App() {
  return (
    <>
      <Navbar2 />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/property" element={<Property />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        <Route
          path="/post"
          element={
            <RequireAuth>
              <Post />
            </RequireAuth>
          }
        />

        {/* เส้นทาง Admin (ต้องมี token + scope admin) */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
      <FooterPage />
    </>
  );
}
