// src/routes/RequireAdmin.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAdmin({ children }) {
  const { isAuthenticated, user } = useAuth();
  const scopes = Array.isArray(user?.scopes)
    ? user.scopes.map(s => (typeof s === "string" ? s : s.scope_name))
    : [];

  const isAdmin =
    user?.role === "admin" ||
    scopes.includes("admin") ||
    user?.is_admin === true;

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
}
