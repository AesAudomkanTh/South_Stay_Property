// src/components/PostLikeButton.jsx
import React, { useEffect, useState } from 'react';
import { API_BASE, authFetch } from '../utils/authFetch';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PostLikeButton({
  postId,
  initialLiked = false,
  initialCount = 0,
  className = '',
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [liked, setLiked] = useState(!!initialLiked);
  const [count, setCount] = useState(Number(initialCount || 0));
  const [loading, setLoading] = useState(false);

  // โหลดสถานะจริงจากเซิร์ฟเวอร์ตอน mount (กันค่าเริ่มต้นคลาดเคลื่อน)
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await authFetch(`${API_BASE}/api/likes/status?post_id=${encodeURIComponent(postId)}`);
        if (!ignore) {
          setLiked(!!data.liked);
          setCount(Number(data.count || 0));
        }
      } catch (e) {
        // เงียบไว้ก็ได้ ถ้า 401 แปลว่ายังไม่ล็อกอิน
      }
    }
    if (postId) load();
    return () => { ignore = true; };
  }, [postId]);

  async function onToggle() {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (loading) return;
    setLoading(true);

    // optimistic update
    setLiked(prev => {
      const next = !prev;
      setCount(c => c + (next ? 1 : -1));
      return next;
    });

    try {
      const { liked: realLiked, count: realCount } = await authFetch(`${API_BASE}/api/likes/toggle`, {
        method: 'POST',
        body: JSON.stringify({ post_id: postId }),
      });
      // sync กับของจริง
      setLiked(!!realLiked);
      setCount(Number(realCount || 0));
    } catch (e) {
      // ถ้าพังให้ revert ง่าย ๆ: โหลดสถานะล่าสุดกลับมา
      try {
        const data = await authFetch(`${API_BASE}/api/likes/status?post_id=${encodeURIComponent(postId)}`);
        setLiked(!!data.liked);
        setCount(Number(data.count || 0));
      } catch {}
      console.error('toggle like failed:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1 select-none ${loading ? 'opacity-60' : ''} ${className}`}
      aria-pressed={liked}
      aria-label={liked ? 'ยกเลิกถูกใจ' : 'ถูกใจ'}
      title={liked ? 'ยกเลิกถูกใจ' : 'ถูกใจ'}
    >
      {/* ไอคอนหัวใจ (SVG) */}
      <svg
        width="20" height="20" viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={liked ? 'text-rose-500' : 'text-zinc-400'}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <span className="text-sm">{count}</span>
    </button>
  );
}
