// src/components/NotificationBell.jsx
import React from 'react';
import { useChat } from '../context/ChatSocketProvider';

export default function NotificationBell({ onClick }) {
  const { totalUnread } = useChat();
  return (
    <button onClick={onClick} className="relative inline-flex items-center">
      <span>🔔</span>
      {totalUnread > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
          {totalUnread}
        </span>
      )}
    </button>
  );
}
