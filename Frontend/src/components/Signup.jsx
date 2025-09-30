// src/pages/SignUp.jsx
import React, { useState } from "react";
import "./SignUp.css";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

export default function SignUp() {
  const navigate = useNavigate();

  const [titleTh, setTitleTh] = useState("นาย");
  const [firstNameTh, setFirstNameTh] = useState("");
  const [lastNameTh, setLastNameTh] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [cid, setCid] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const digitsOnly = (s = "") => (s || "").replace(/\D+/g, "");

  async function handleSubmit(e) {
    e.preventDefault();

    const uname = username.trim();
    const mail  = email.trim();
    const fname = firstNameTh.trim();
    const lname = lastNameTh.trim();
    const tel   = digitsOnly(telephone);
    const cidClean = digitsOnly(cid);

    if (uname.length < 3) return toast.error("Username อย่างน้อย 3 ตัวอักษร");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return toast.error("อีเมลไม่ถูกต้อง");
    if (!password || password.length < 8) return toast.error("รหัสผ่านอย่างน้อย 8 ตัวอักษร");
    if (!fname || !lname) return toast.error("กรุณากรอกชื่อ-นามสกุลภาษาไทย");
    if (tel.length < 9 || tel.length > 15) return toast.error("เบอร์โทรต้องเป็นตัวเลข 9–15 หลัก");
    if (cidClean.length !== 13) return toast.error("เลขบัตรประชาชนต้องมี 13 หลัก");

    const payload = {
      username: uname.toLowerCase(),
      password,
      email: mail.toLowerCase(),
      telephone: tel,
      cid: cidClean,
      first_name_th: fname,
      last_name_th: lname,
      title_th: titleTh,
    };

    // ✅ log เป็น string เพื่อดูค่าแน่นอน
    console.log("📤 [SIGNUP DEBUG] payload JSON:", JSON.stringify(payload));

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      console.log("📩 [SIGNUP DEBUG] response:", { status: res.status, ok: res.ok, data });

      if (!res.ok) {
        const details = data?.details?.fieldErrors || data?.details || data?.error || data?.message;
        if (details) console.warn("❗ server validation details:", details);
        throw new Error(data?.message || data?.error || "Validation error");
      }

      toast.success("สมัครสมาชิกสำเร็จ ✨ กรุณาเข้าสู่ระบบ");
      navigate("/login");
    } catch (err) {
      console.error("❌ [SIGNUP DEBUG] error:", err);
      toast.error(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sign-up-container">
      <form className="sign-up-form" onSubmit={handleSubmit} noValidate>
        <h2 className="sign-up-title">Sign Up</h2>

        <select className="sign-up-input" value={titleTh} onChange={(e) => setTitleTh(e.target.value)} required>
          <option value="นาย">นาย</option>
          <option value="นาง">นาง</option>
          <option value="นางสาว">นางสาว</option>
          <option value="อื่นๆ">อื่นๆ</option>
        </select>

        <input className="sign-up-input" type="text" placeholder="ชื่อ (ภาษาไทย)" value={firstNameTh} onChange={(e) => setFirstNameTh(e.target.value)} required />
        <input className="sign-up-input" type="text" placeholder="นามสกุล (ภาษาไทย)" value={lastNameTh} onChange={(e) => setLastNameTh(e.target.value)} required />
        <input className="sign-up-input" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
        <input className="sign-up-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <input className="sign-up-input" type="tel" placeholder="เบอร์โทรศัพท์ (ตัวเลขเท่านั้น)" value={telephone} onChange={(e) => setTelephone(e.target.value)} inputMode="numeric" required />
        <input className="sign-up-input" type="text" placeholder="เลขบัตรประชาชน (13 หลัก)" value={cid} onChange={(e) => setCid(e.target.value)} inputMode="numeric" maxLength={20} required />
        <input className="sign-up-input sign-up-password" type="password" placeholder="Password (อย่างน้อย 8 ตัวอักษร)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete="new-password" />

        <button type="submit" className="sign-up-button" disabled={loading}>
          {loading ? "กำลังสร้างบัญชี..." : "Create Account"}
        </button>

        <p className="sign-up-footer">
          Already have an account? <Link to="/login" className="sign-up-link">Sign In</Link>
        </p>
      </form>
    </div>
  );
}
