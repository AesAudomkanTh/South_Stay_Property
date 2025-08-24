// Blog.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Blog.css';

const items = [
  {
    id: 'p-101',
    title: 'Color Psychology in UI: How to Choose the Right Palette',
    category: 'UI/UX design',
    image: 'https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?w=1200&h=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'p-102',
    title: 'Color Psychology in UI: How to Choose the Right Palette',
    category: 'UI/UX design',
    image: 'https://images.unsplash.com/photo-1714974528646-ea024a3db7a7?w=1200&h=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'p-101',
    title: 'Color Psychology in UI: How to Choose the Right Palette',
    category: 'UI/UX design',
    image: 'https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?w=1200&h=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'p-102',
    title: 'Color Psychology in UI: How to Choose the Right Palette',
    category: 'UI/UX design',
    image: 'https://images.unsplash.com/photo-1714974528646-ea024a3db7a7?w=1200&h=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'p-101',
    title: 'Color Psychology in UI: How to Choose the Right Palette',
    category: 'UI/UX design',
    image: 'https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?w=1200&h=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'p-102',
    title: 'Color Psychology in UI: How to Choose the Right Palette',
    category: 'UI/UX design',
    image: 'https://images.unsplash.com/photo-1714974528646-ea024a3db7a7?w=1200&h=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'p-101',
    title: 'Color Psychology in UI: How to Choose the Right Palette',
    category: 'UI/UX design',
    image: 'https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?w=1200&h=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'p-102',
    title: 'Color Psychology in UI: How to Choose the Right Palette',
    category: 'UI/UX design',
    image: 'https://images.unsplash.com/photo-1714974528646-ea024a3db7a7?w=1200&h=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'p-101',
    title: 'Color Psychology in UI: How to Choose the Right Palette',
    category: 'UI/UX design',
    image: 'https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?w=1200&h=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'p-102',
    title: 'Color Psychology in UI: How to Choose the Right Palette',
    category: 'UI/UX design',
    image: 'https://images.unsplash.com/photo-1714974528646-ea024a3db7a7?w=1200&h=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'p-101',
    title: 'Color Psychology in UI: How to Choose the Right Palette',
    category: 'UI/UX design',
    image: 'https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?w=1200&h=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'p-102',
    title: 'Color Psychology in UI: How to Choose the Right Palette',
    category: 'UI/UX design',
    image: 'https://images.unsplash.com/photo-1714974528646-ea024a3db7a7?w=1200&h=800&auto=format&fit=crop&q=60',
  },
  // ...เติมรายการอื่น ๆ
];

export default function Blog() {
  return (
    <div className="blog-container">
      <h1 className="blog-title">Latest Blog</h1>

      <div className="blog-list">
        {items.map((it) => (
          <Link
            key={it.id}
            to={`/property/${it.id}`}
            state={{ // ⬅️ ส่ง state ไปหน้า detail
              id: it.id,
              title: it.title,
              image: it.image,
              category: it.category,
            }}
            className="blog-card" // ให้ทั้งการ์ดคลิกได้
          >
            <img className="blog-image" src={it.image} alt={it.title} />
            <h3 className="blog-card-title">{it.title}</h3>
            <p className="blog-category">{it.category}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
