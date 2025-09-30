// src/Adminn/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

/* ----------------------------- */
/* authFetch (แนบ token + debug) */
/* ----------------------------- */
async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token") || "";
  const headers = options.headers ? { ...options.headers } : {};

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const req = { url, method: options.method || "GET", headers, body: options.body };
  console.debug("🌐 [ADMIN] Request", req);

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  console.debug("📩 [ADMIN] Response", { url, status: res.status, ok: res.ok, data });

  if (!res.ok) {
    const msg = data?.message || data?.error || (typeof data === "string" ? data : `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return data;
}

/* ----------------------------- */
/* API layer                     */
/* ----------------------------- */
const api = {
  // USERS
  async listUsers() {
    const out = await authFetch(`${BASE_URL}/api/admin/users`, { method: "GET" });
    return Array.isArray(out) ? out : out.users || [];
  },
  async approveUser(user_id, status = "verified") {
    // รองรับ backend ที่ทำ verify แยก
    // ถ้าไม่มี endpoint นี้ในระบบคุณ ให้คงไว้เฉพาะ updateUser ด้านล่าง
    try {
      return await authFetch(`${BASE_URL}/api/admin/users/${user_id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      // fallback เผื่อไม่มี /verify
      return await api.updateUser(user_id, { verify_status: status, status });
    }
  },
  async updateUser(user_id, patch) {
    return await authFetch(`${BASE_URL}/api/admin/users/${user_id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },
  async deleteUser(user_id) {
    return await authFetch(`${BASE_URL}/api/admin/users/${user_id}`, {
      method: "DELETE",
    });
  },

  // POSTS
  async listPosts(status = "pending") {
    const out = await authFetch(`${BASE_URL}/api/admin/posts?status=${encodeURIComponent(status)}`, {
      method: "GET",
    });
    return Array.isArray(out) ? out : out.posts || [];
  },
  async approvePost(post_id) {
    // หลายโปรเจ็กต์ใช้ POST /approve
    return await authFetch(`${BASE_URL}/api/admin/posts/${post_id}/approve`, {
      method: "POST",
      body: JSON.stringify({ approve: true }),
    });
  },
  async rejectPost(post_id) {
    return await authFetch(`${BASE_URL}/api/admin/posts/${post_id}/reject`, {
      method: "POST",
      body: JSON.stringify({ approve: false }),
    });
  },
  async updatePost(post_id, patch) {
    // ใช้ PUT เพื่อปรับ status/price/title
    return await authFetch(`${BASE_URL}/api/admin/posts/${post_id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
  },
  async deletePost(post_id) {
    return await authFetch(`${BASE_URL}/api/admin/posts/${post_id}`, {
      method: "DELETE",
    });
  },
};

/* ----------------------------- */
/* Small UI bits                  */
/* ----------------------------- */
function Badge({ children, intent = "slate" }) {
  const map = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <span className={`badge inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[intent]}`}>
      {children}
    </span>
  );
}

function Button({ children, intent = "default", size = "md", className = "", ...props }) {
  const intentMap = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
    success: "bg-emerald-600 text-white hover:bg-emerald-500",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    warning: "bg-amber-500 text-white hover:bg-amber-400",
  };
  const sizeMap = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-sm",
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium transition ${intentMap[intent]} ${sizeMap[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function StatCard({ title, value, sub, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">{icon}</div>
      </div>
    </div>
  );
}

function Empty({ title = "No data", hint }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-10 text-center">
      <div className="mb-2 text-lg font-semibold text-slate-800">{title}</div>
      {hint && <div className="text-sm text-slate-500">{hint}</div>}
    </div>
  );
}

function Confirm({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black/40 p-4">
      <div className="modal-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button intent="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            intent="danger"
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- */
/* DataTable (ใช้ร่วม Users/Posts) */
/* ----------------------------- */
function DataTable({ columns, rows, getRowKey, searchKeys = [], onApprove, onReject, onEdit, onDelete, onInactivate }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows || [];
    if (q && searchKeys.length) {
      out = out.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)));
    }
    if (sort.key) {
      out = [...out].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        if (av === bv) return 0;
        const res = av > bv ? 1 : -1;
        return sort.dir === "asc" ? res : -1 * res;
      });
    }
    return out;
  }, [rows, query, sort, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [query, rows]);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <div className="w-full">
      <div className="table-toolbar mb-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400"
          />
          <span className="pointer-events-none absolute right-3 top-2.5 text-slate-400">⌘K</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  <button
                    onClick={() => c.sortable && toggleSort(c.key)}
                    className={`inline-flex items-center gap-1 ${c.sortable ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {c.header}
                    {c.sortable && sort.key === c.key && (
                      <span className="text-slate-400">{sort.dir === "asc" ? "▲" : "▼"}</span>
                    )}
                  </button>
                </th>
              ))}
              {(onApprove || onReject || onEdit || onDelete || onInactivate) && (
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {pageRows.map((row) => (
              <tr key={getRowKey(row)} className="hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-800">
                    {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "-")}
                  </td>
                ))}
                {(onApprove || onReject || onEdit || onDelete || onInactivate) && (
                  <td className="px-5 py-3.5 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      {onApprove && (
                        <Button size="sm" intent="success" onClick={() => onApprove(row)}>
                          Approve
                        </Button>
                      )}
                      {onReject && (
                        <Button size="sm" intent="warning" onClick={() => onReject(row)}>
                          Reject
                        </Button>
                      )}
                      {onInactivate && (
                        <Button size="sm" intent="danger" onClick={() => onInactivate(row)}>
                          Inactive
                        </Button>
                      )}
                      {onEdit && (
                        <Button size="sm" intent="outline" onClick={() => onEdit(row)}>
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button size="sm" intent="danger" onClick={() => onDelete(row)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="mt-6">
          <Empty title="No results" hint="Try a different search query or filter." />
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to
            <span className="font-medium"> {Math.min(page * pageSize, filtered.length)}</span> of
            <span className="font-medium"> {filtered.length}</span>
          </p>
          <div className="pagination flex items-center gap-2">
            <Button size="sm" intent="ghost" disabled={page === 1} onClick={() => setPage(1)}>
              « First
            </Button>
            <Button size="sm" intent="ghost" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ‹ Prev
            </Button>
            <span className="text-xs text-slate-600">
              Page {page} / {Math.max(1, Math.ceil(filtered.length / pageSize))}
            </span>
            <Button
              size="sm"
              intent="ghost"
              disabled={page === Math.max(1, Math.ceil(filtered.length / pageSize))}
              onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(filtered.length / pageSize)), p + 1))}
            >
              Next ›
            </Button>
            <Button
              size="sm"
              intent="ghost"
              disabled={page === Math.max(1, Math.ceil(filtered.length / pageSize))}
              onClick={() => setPage(Math.max(1, Math.ceil(filtered.length / pageSize)))}
            >
              Last »
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- */
/* Main Admin Dashboard           */
/* ----------------------------- */
export default function AdminDashboard() {
  const [tab, setTab] = useState("posts"); // posts | users
  const [loading, setLoading] = useState(true);

  // Users
  const [users, setUsers] = useState([]);
  const [usersFailed, setUsersFailed] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Posts
  const [posts, setPosts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending"); // pending | active | rejected | inactive | sold
  const [editPost, setEditPost] = useState(null);

  const [confirm, setConfirm] = useState({ open: false, onConfirm: null, title: "", message: "" });

  async function loadUsersSafe() {
    try {
      const u = await api.listUsers();
      setUsers(u);
      setUsersFailed(false);
    } catch (e) {
      setUsersFailed(true);
      console.warn("[ADMIN] /api/admin/users error, continue without users:", e?.message || e);
      toast.error("โหลด users ไม่สำเร็จ (ซ่อนแท็บ Users ชั่วคราว)");
    }
  }

  async function loadPosts(status = statusFilter) {
    const p = await api.listPosts(status);
    setPosts(p);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // พยายามโหลด users แบบไม่ให้ล้มทั้งหน้า
        await loadUsersSafe();
        // โหลด posts
        await loadPosts("pending");
        setStatusFilter("pending");
      } catch (err) {
        console.error("💥 [ADMIN] bootstrap error:", err);
        toast.error(err.message || "โหลดข้อมูลล้มเหลว");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    // เปลี่ยน filter => reload posts
    (async () => {
      try {
        setLoading(true);
        await loadPosts(statusFilter);
      } catch (err) {
        console.error("💥 [ADMIN] load posts error:", err);
        toast.error(err.message || "โหลดโพสต์ล้มเหลว");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  /* ---------- Stats ---------- */
  const stats = useMemo(() => {
    const usersActive =
      users.filter((u) => (u.verify_status || u.status) === "verified" || (u.verify_status || u.status) === "active")
        .length || 0;
    const usersPending = users.filter((u) => (u.verify_status || u.status) === "pending").length || 0;

    const pStatus = (p) => p.status || p.post_status;
    const postsPending = posts.filter((p) => pStatus(p) === "pending").length || 0;
    const postsActive = posts.filter((p) => pStatus(p) === "active" || pStatus(p) === "published").length || 0;

    return {
      users: users.length,
      activeUsers: usersActive,
      pendingUsers: usersPending,
      posts: posts.length,
      pendingPosts: postsPending,
      activePosts: postsActive,
    };
  }, [users, posts]);

  /* ---------- Users actions ---------- */
  async function handleApproveUser(row) {
    try {
      await api.approveUser(row.user_id || row.id, "verified");
      setUsers((list) =>
        list.map((u) =>
          (u.user_id || u.id) === (row.user_id || row.id) ? { ...u, verify_status: "verified", status: "active" } : u
        )
      );
      toast.success("Verified user สำเร็จ");
    } catch (e) {
      toast.error(e.message || "อนุมัติผู้ใช้ไม่สำเร็จ");
    }
  }
  function handleDeleteUser(row) {
    setConfirm({
      open: true,
      title: "Delete user",
      message: `แน่ใจหรือไม่ที่จะลบ ${row.username || row.name}? การกระทำนี้ย้อนกลับไม่ได้`,
      onConfirm: async () => {
        try {
          await api.deleteUser(row.user_id || row.id);
          setUsers((list) => list.filter((u) => (u.user_id || u.id) !== (row.user_id || row.id)));
          toast.success("ลบผู้ใช้แล้ว");
        } catch (e) {
          toast.error(e.message || "ลบผู้ใช้ไม่สำเร็จ");
        }
      },
    });
  }
  async function handleSaveUser() {
    if (!editUser) return;
    const id = editUser.user_id || editUser.id;
    const patch = {
      name: editUser.name,
      email: editUser.email,
      role: editUser.role,
      verify_status: editUser.verify_status,
      status: editUser.status,
    };
    try {
      await api.updateUser(id, patch);
      setUsers((list) => list.map((u) => ((u.user_id || u.id) === id ? { ...u, ...patch } : u)));
      setEditUser(null);
      toast.success("บันทึกผู้ใช้แล้ว");
    } catch (e) {
      toast.error(e.message || "บันทึกผู้ใช้ไม่สำเร็จ");
    }
  }

  /* ---------- Posts actions ---------- */
  async function handleApprovePost(row) {
    try {
      await api.approvePost(row.post_id || row.id);
      toast.success("อนุมัติโพสต์แล้ว");
      setPosts((list) =>
        list.map((p) =>
          (p.post_id || p.id) === (row.post_id || row.id) ? { ...p, status: "active", post_status: "active" } : p
        )
      );
    } catch (e) {
      toast.error(e.message || "อนุมัติโพสต์ไม่สำเร็จ");
    }
  }

  async function handleRejectPost(row) {
    try {
      await api.rejectPost(row.post_id || row.id);
      toast.success("ปฏิเสธโพสต์แล้ว");
      setPosts((list) =>
        list.map((p) =>
          (p.post_id || p.id) === (row.post_id || row.id) ? { ...p, status: "rejected", post_status: "rejected" } : p
        )
      );
    } catch (e) {
      toast.error(e.message || "ปฏิเสธโพสต์ไม่สำเร็จ");
    }
  }

  function handleInactivatePost(row) {
    setConfirm({
      open: true,
      title: "Set inactive",
      message: `ต้องการเปลี่ยนสถานะเป็น inactive สำหรับ "${row.title}" ใช่ไหม?`,
      onConfirm: async () => {
        try {
          await api.updatePost(row.post_id || row.id, { status: "inactive" });
          setPosts((list) =>
            list.map((p) => (p.post_id === (row.post_id || row.id) ? { ...p, status: "inactive" } : p))
          );
          toast.success("เปลี่ยนสถานะเป็น inactive แล้ว");
        } catch (e) {
          toast.error(e.message || "เปลี่ยนสถานะไม่สำเร็จ");
        }
      },
    });
  }

  async function handleSavePost() {
    if (!editPost) return;
    const id = editPost.post_id || editPost.id;
    const patch = {
      title: editPost.title,
      price: Number(editPost.price || 0),
      status: editPost.status, // pending | active | rejected | inactive | sold
    };
    try {
      await api.updatePost(id, patch);
      setPosts((list) => list.map((p) => ((p.post_id || p.id) === id ? { ...p, ...patch } : p)));
      setEditPost(null);
      toast.success("บันทึกโพสต์แล้ว");
    } catch (e) {
      toast.error(e.message || "บันทึกโพสต์ไม่สำเร็จ");
    }
  }

  /* ---------- Columns ---------- */
  const userColumns = [
    { key: "user_id", header: "ID", sortable: true, render: (v, r) => v || r.id },
    { key: "username", header: "Username", sortable: true, render: (v, r) => v || r.name || "-" },
    { key: "email", header: "Email", sortable: true, render: (v) => v || "-" },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (v) => <Badge intent={v === "admin" ? "violet" : "blue"}>{v || "member"}</Badge>,
    },
    {
      key: "verify_status",
      header: "Verify",
      sortable: true,
      render: (v, r) => {
        const status = v || r.status || "pending";
        const intent = status === "verified" || status === "active" ? "green" : status === "pending" ? "amber" : "slate";
        return <Badge intent={intent}>{status}</Badge>;
      },
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (v, r) => {
        const dt = v || r.createdAt;
        return dt ? new Date(dt).toLocaleString() : "-";
      },
    },
  ];

  const postColumns = [
    { key: "post_id", header: "ID", sortable: true, render: (v, r) => v || r.id },
    { key: "title", header: "Title", sortable: true },
    { key: "username", header: "Author", sortable: true, render: (v, r) => v || r.author || "-" },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (v, r) => {
        const s = v || r.post_status || "pending";
        const intent = s === "active" || s === "published" ? "green" : s === "pending" ? "amber" : s === "rejected" ? "red" : "slate";
        return <Badge intent={intent}>{s}</Badge>;
      },
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (v) => (v ? `${Number(v).toLocaleString()} ฿` : "-"),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (v, r) => {
        const dt = v || r.createdAt;
        return dt ? new Date(dt).toLocaleString() : "-";
      },
    },
  ];

  /* ---------- Which tabs to show? ---------- */
  const tabs = [
    { id: "posts", label: `Posts (${stats.posts})` },
    // แสดงแท็บ Users เฉพาะเมื่อโหลด users สำเร็จ
    ...(!usersFailed ? [{ id: "users", label: `Users (${stats.users})` }] : []),
  ];

  return (
    <div className="admin-shell min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <span className="text-sm font-semibold">ADM</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Admin Console</h1>
              <p className="text-xs text-slate-500">Real Estate Management</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  tab === t.id ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-8 space-y-8">
        {loading ? (
          <div className="py-24 text-center text-slate-500">Loading…</div>
        ) : (
          <>
            {/* POSTS TAB */}
            {tab === "posts" && (
              <section className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Posts</h2>
                    <div className="text-xs text-slate-500">
                      filter: <strong>{statusFilter}</strong> • {stats.posts} loaded
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="active">active</option>
                      <option value="rejected">rejected</option>
                      <option value="inactive">inactive</option>
                      <option value="sold">sold</option>
                    </select>
                    <Button intent="outline" onClick={() => loadPosts(statusFilter)}>
                      Reload
                    </Button>
                  </div>
                </div>

                <DataTable
                  columns={postColumns}
                  rows={posts}
                  getRowKey={(r) => r.post_id || r.id}
                  searchKeys={["post_id", "id", "title", "username", "author", "status", "post_status", "price"]}
                  onApprove={(r) => handleApprovePost(r)}
                  onReject={(r) => handleRejectPost(r)}
                  onEdit={(r) =>
                    setEditPost({
                      ...r,
                      status: r.status || r.post_status || "pending",
                      price: Number(r.price || 0),
                    })
                  }
                  onInactivate={(r) => handleInactivatePost(r)}
                />

                {/* Edit post drawer */}
                {editPost && (
                  <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
                    <div className="drawer h-full w-full max-w-md bg-white p-6 shadow-xl">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900">Edit post</h3>
                        <Button intent="ghost" onClick={() => setEditPost(null)}>
                          Close
                        </Button>
                      </div>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="text-xs text-slate-600">Title</label>
                          <input
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                            value={editPost.title || ""}
                            onChange={(e) => setEditPost((s) => ({ ...s, title: e.target.value }))}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-600">Price (฿)</label>
                            <input
                              type="number"
                              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                              value={Number(editPost.price || 0)}
                              onChange={(e) => setEditPost((s) => ({ ...s, price: Number(e.target.value) }))}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600">Status</label>
                            <select
                              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                              value={editPost.status || "pending"}
                              onChange={(e) => setEditPost((s) => ({ ...s, status: e.target.value }))}
                            >
                              <option value="pending">pending</option>
                              <option value="active">active</option>
                              <option value="rejected">rejected</option>
                              <option value="inactive">inactive</option>
                              <option value="sold">sold</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-slate-500">
                            post_id: <span className="font-mono">{editPost.post_id || editPost.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button intent="warning" onClick={() => handleRejectPost(editPost)}>
                              Reject
                            </Button>
                            <Button intent="success" onClick={() => handleApprovePost(editPost)}>
                              Approve
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button intent="ghost" onClick={() => setEditPost(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSavePost}>Save changes</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* USERS TAB (ซ่อนถ้าโหลดไม่สำเร็จ) */}
            {tab === "users" && !usersFailed && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Users</h2>
                  <div className="text-xs text-slate-500">
                    {stats.users} total • {stats.pendingUsers} pending
                  </div>
                </div>

                <DataTable
                  columns={userColumns}
                  rows={users}
                  getRowKey={(r) => r.user_id || r.id}
                  searchKeys={["user_id", "id", "username", "name", "email", "role", "verify_status", "status"]}
                  onApprove={(r) => handleApproveUser(r)}
                  onEdit={(r) =>
                    setEditUser({
                      ...r,
                      name: r.name || r.username || "",
                      status: r.status || r.verify_status || "pending",
                    })
                  }
                  onDelete={(r) => handleDeleteUser(r)}
                />

                {/* Edit user drawer */}
                {editUser && (
                  <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
                    <div className="drawer h-full w-full max-w-md bg-white p-6 shadow-xl">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900">Edit user</h3>
                        <Button intent="ghost" onClick={() => setEditUser(null)}>
                          Close
                        </Button>
                      </div>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="text-xs text-slate-600">Name</label>
                          <input
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                            value={editUser.name || ""}
                            onChange={(e) => setEditUser((s) => ({ ...s, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600">Email</label>
                          <input
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                            value={editUser.email || ""}
                            onChange={(e) => setEditUser((s) => ({ ...s, email: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600">Role</label>
                          <select
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                            value={editUser.role || "member"}
                            onChange={(e) => setEditUser((s) => ({ ...s, role: e.target.value }))}
                          >
                            <option value="member">member</option>
                            <option value="admin">admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600">Verify/Status</label>
                          <select
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                            value={editUser.verify_status || editUser.status || "pending"}
                            onChange={(e) =>
                              setEditUser((s) => ({ ...s, verify_status: e.target.value, status: e.target.value }))
                            }
                          >
                            <option value="pending">pending</option>
                            <option value="verified">verified</option>
                            <option value="active">active</option>
                            <option value="rejected">rejected</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Button intent="ghost" onClick={() => setEditUser(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveUser}>Save changes</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <Confirm
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onClose={() => setConfirm((s) => ({ ...s, open: false }))}
        onConfirm={confirm.onConfirm || (() => {})}
      />
    </div>
  );
}
