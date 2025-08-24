// src/Adminn/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";
import toast from "react-hot-toast";

/**
 * AdminDashboard.jsx
 * - ต่อกับ backend: /api/admin/users, /api/admin/posts, และ endpoints อื่นๆ ที่แนะนำไว้
 * - มี authFetch แนบ Bearer token อัตโนมัติ + console.debug ครบ
 * - ยังคงโครง UI เดิม (Badge, Button, DataTable ฯลฯ) แต่เชื่อมข้อมูลจริงแทน mock
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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
    // พยายามดึง message ที่อ่านง่าย
    const msg =
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data : `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return data;
}

/* ----------------------------- */
/* API layer (ผูกกับ /api/admin)  */
/* ----------------------------- */
const api = {
  // USERS
  async listUsers() {
    const out = await authFetch(`${BASE_URL}/api/admin/users`, { method: "GET" });
    // รองรับทั้ง {users:[...]} หรือ array ตรง ๆ
    return Array.isArray(out) ? out : out.users || [];
  },
  async approveUser(user_id) {
    // verify user (set verify_status = 'verified')
    return await authFetch(`${BASE_URL}/api/admin/users/${user_id}/verify`, {
      method: "POST",
      body: JSON.stringify({ status: "verified" }),
    });
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
  async listPosts() {
    const out = await authFetch(`${BASE_URL}/api/admin/posts`, { method: "GET" });
    return Array.isArray(out) ? out : out.posts || [];
  },
  async approvePost(post_id) {
    return await authFetch(`${BASE_URL}/api/admin/posts/${post_id}/approve`, {
      method: "POST",
      body: JSON.stringify({ approve: true }),
    });
  },
  async updatePost(post_id, patch) {
    return await authFetch(`${BASE_URL}/api/admin/posts/${post_id}`, {
      method: "PATCH",
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
              onConfirm();
              onClose();
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- */
/* DataTable (Users & Posts ใช้ร่วม) */
/* ----------------------------- */
function DataTable({ columns, rows, getRowKey, searchKeys = [], onApprove, onEdit, onDelete }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const pageSize = 8;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows || [];
    if (q) {
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
              {(onApprove || onEdit || onDelete) && (
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
                {(onApprove || onEdit || onDelete) && (
                  <td className="px-5 py-3.5 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      {onApprove && (
                        <Button size="sm" intent="success" onClick={() => onApprove(row)}>
                          Approve
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
          <Empty title="No results" hint="Try a different search query." />
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
              Page {page} / {totalPages}
            </span>
            <Button
              size="sm"
              intent="ghost"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next ›
            </Button>
            <Button size="sm" intent="ghost" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
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
  const [tab, setTab] = useState("dashboard"); // dashboard | users | posts
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState({ open: false, onConfirm: null, title: "", message: "" });
  const [editUser, setEditUser] = useState(null);
  const [editPost, setEditPost] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [u, p] = await Promise.all([api.listUsers(), api.listPosts()]);
        setUsers(u);
        setPosts(p);
      } catch (err) {
        console.error("💥 [ADMIN] bootstrap error:", err);
        toast.error(err.message || "โหลดข้อมูลแอดมินล้มเหลว");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const pendingUsers = users.filter((u) => (u.verify_status || u.status) === "pending").length;
    const pendingPosts = posts.filter((p) => (p.status || p.post_status) === "pending").length;
    return {
      users: users.length,
      posts: posts.length,
      pendingUsers,
      pendingPosts,
      activeUsers: users.filter((u) => (u.verify_status || u.status) === "verified" || (u.status === "active")).length,
      publishedPosts: posts.filter((p) => (p.status || p.post_status) === "published" || (p.status === "active")).length,
    };
  }, [users, posts]);

  /* ---------- Users actions ---------- */
  async function handleApproveUser(row) {
    try {
      await api.approveUser(row.user_id || row.id);
      setUsers((list) =>
        list.map((u) =>
          (u.user_id || u.id) === (row.user_id || row.id)
            ? { ...u, verify_status: "verified", status: "active" }
            : u
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
      message: `Are you sure you want to delete ${row.username || row.name}? This action cannot be undone.`,
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
      setUsers((list) =>
        list.map((u) => ((u.user_id || u.id) === id ? { ...u, ...patch } : u))
      );
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
      setPosts((list) =>
        list.map((p) =>
          (p.post_id || p.id) === (row.post_id || row.id)
            ? { ...p, status: "published", post_status: "published" }
            : p
        )
      );
      toast.success("อนุมัติโพสต์แล้ว");
    } catch (e) {
      toast.error(e.message || "อนุมัติโพสต์ไม่สำเร็จ");
    }
  }
  function handleDeletePost(row) {
    setConfirm({
      open: true,
      title: "Delete post",
      message: `Are you sure you want to delete "${row.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.deletePost(row.post_id || row.id);
          setPosts((list) => list.filter((p) => (p.post_id || p.id) !== (row.post_id || row.id)));
          toast.success("ลบโพสต์แล้ว");
        } catch (e) {
          toast.error(e.message || "ลบโพสต์ไม่สำเร็จ");
        }
      },
    });
  }
  async function handleSavePost() {
    if (!editPost) return;
    const id = editPost.post_id || editPost.id;
    const patch = {
      title: editPost.title,
      status: editPost.status || editPost.post_status,
      price: editPost.price,
    };
    try {
      await api.updatePost(id, patch);
      setPosts((list) =>
        list.map((p) => ((p.post_id || p.id) === id ? { ...p, ...patch } : p))
      );
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
        const intent = s === "published" || s === "active" ? "green" : s === "pending" ? "amber" : "red";
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
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "users", label: `Users (${stats.users})` },
              { id: "posts", label: `Posts (${stats.posts})` },
            ].map((t) => (
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
            {/* DASHBOARD TAB */}
            {tab === "dashboard" && (
              <section className="space-y-8">
                <div className="grid grid-cols-1 gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="Total Users"
                    value={stats.users}
                    sub={`${stats.activeUsers} active • ${stats.pendingUsers} pending`}
                    icon={<span className="text-xl">👥</span>}
                  />
                  <StatCard
                    title="Total Posts"
                    value={stats.posts}
                    sub={`${stats.publishedPosts} published • ${stats.pendingPosts} pending`}
                    icon={<span className="text-xl">🏢</span>}
                  />
                  <StatCard
                    title="Approval Queue"
                    value={stats.pendingUsers + stats.pendingPosts}
                    sub="Items awaiting review"
                    icon={<span className="text-xl">✅</span>}
                  />
                  <StatCard
                    title="Admins"
                    value={users.filter((u) => (u.role || "").toString().toLowerCase() === "admin").length}
                    sub="Users with elevated permissions"
                    icon={<span className="text-xl">🛡️</span>}
                  />
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-900">Recent Pending Items</h3>
                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-800">Users</h4>
                          <Badge intent="amber">{stats.pendingUsers} pending</Badge>
                        </div>
                        <ul className="space-y-3">
                          {users
                            .filter((u) => (u.verify_status || u.status) === "pending")
                            .slice(0, 5)
                            .map((u) => (
                              <li key={u.user_id || u.id} className="flex items-center justify-between text-sm">
                                <span className="truncate">
                                  {(u.username || u.name) ?? "—"} • {u.email ?? "—"}
                                </span>
                                <Button size="sm" intent="success" onClick={() => handleApproveUser(u)}>
                                  Approve
                                </Button>
                              </li>
                            ))}
                          {stats.pendingUsers === 0 && <li className="text-sm text-slate-500">Nothing waiting 🎉</li>}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-800">Posts</h4>
                          <Badge intent="amber">{stats.pendingPosts} pending</Badge>
                        </div>
                        <ul className="space-y-3">
                          {posts
                            .filter((p) => (p.status || p.post_status) === "pending")
                            .slice(0, 5)
                            .map((p) => (
                              <li key={p.post_id || p.id} className="flex items-center justify-between text-sm">
                                <span className="truncate">
                                  {p.title ?? "—"} • {p.username || p.author || "—"}
                                </span>
                                <Button size="sm" intent="success" onClick={() => handleApprovePost(p)}>
                                  Approve
                                </Button>
                              </li>
                            ))}
                          {stats.pendingPosts === 0 && <li className="text-sm text-slate-500">Nothing waiting 🎉</li>}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm quick-actions">
                    <h3 className="text-base font-semibold text-slate-900">Quick Actions</h3>
                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <Button onClick={() => setTab("users")}>Review Users</Button>
                      <Button onClick={() => setTab("posts")}>Review Posts</Button>
                      <Button intent="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                        Back to top
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* USERS TAB */}
            {tab === "users" && (
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

            {/* POSTS TAB */}
            {tab === "posts" && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Posts</h2>
                  <div className="text-xs text-slate-500">
                    {stats.posts} total • {stats.pendingPosts} pending
                  </div>
                </div>

                <DataTable
                  columns={postColumns}
                  rows={posts}
                  getRowKey={(r) => r.post_id || r.id}
                  searchKeys={["post_id", "id", "title", "username", "author", "status", "post_status"]}
                  onApprove={(r) => handleApprovePost(r)}
                  onEdit={(r) =>
                    setEditPost({
                      ...r,
                      status: r.status || r.post_status || "pending",
                    })
                  }
                  onDelete={(r) => handleDeletePost(r)}
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
                        <div>
                          <label className="text-xs text-slate-600">Status</label>
                          <select
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                            value={editPost.status || "pending"}
                            onChange={(e) => setEditPost((s) => ({ ...s, status: e.target.value }))}
                          >
                            <option value="pending">pending</option>
                            <option value="published">published</option>
                            <option value="rejected">rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600">Price (฿)</label>
                          <input
                            type="number"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                            value={Number(editPost.price || 0)}
                            onChange={(e) => setEditPost((s) => ({ ...s, price: Number(e.target.value) }))}
                          />
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
