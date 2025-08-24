import React from "react";
import { Link } from "react-router-dom";
import "./Login.css";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    const ue = e.currentTarget.elements["ue"]?.value.trim();
    const pw = e.currentTarget.elements["pw"]?.value;

    try {
      await login(ue, pw); 
      // ถ้า login() ใน AuthContext toast success + redirect แล้ว
      // ไม่ต้อง toast ซ้ำที่นี่
    } catch (err) {
      toast.error(err?.message || "ล็อกอินไม่สำเร็จ ❌");
    }
  };

  return (
    <div className="login-container">
      <div className="login-image-wrapper">
        <img
          className="login-image"
          src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/leftSideImage.png"
          alt="leftSideImage"
        />
      </div>

      <div className="login-form-container">
        <form className="login-form" onSubmit={onSubmit}>
          <h2 className="login-title">Sign in</h2>
          <p className="login-subtitle">
            Welcome back! Please sign in to continue
          </p>

          <div className="login-divider">
            <div className="line" />
            <p className="or-text"> sign in with email</p>
            <div className="line" />
          </div>

          <div className="login-input-group">
            {/* ใช้ text เพื่อให้พิมพ์ username ได้ด้วย */}
            <input
              name="ue"
              type="text"
              placeholder="Email or username"
              autoComplete="username email"
              required
            />
          </div>

          <div className="login-input-group mt-6">
            <input
              name="pw"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            {/* ให้ path ตรงกับ App.jsx */}
            <Link to="/forgotpassword" className="forgot-password">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="login-submit-btn">Login</button>
          <p className="login-footer">
            Don’t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
