import React from 'react';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

export default function ForgotPassword() {
  return (
    <div className="forgot-password-wrapper"> {/* ✅ ใช้จัดตรงกลาง */}
      <div className="forgot-password-container">
        <h2 className="forgot-password-title">Forgot Password?</h2>

        <label htmlFor="email" className="forgot-password-label">Email</label>
        <input
          id="email"
          className="forgot-password-input"
          type="email"
          placeholder="Enter your email"
        />

        <button type="button" className="forgot-password-button">
          Send Email
        </button>

        <p className="forgot-password-footer">
          Already have an account?{' '}
          <Link to="/Login" className="forgot-password-signup">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
