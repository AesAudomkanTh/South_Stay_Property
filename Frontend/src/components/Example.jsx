// src/components/Example.jsx
import React from 'react';
import './Example.css'; 

export default function Example() {
  return (
    <div className="example-container">
      <div className="example-inner">
        <h1 className="text-3xl font-semibold text-center mx-auto text-white">
          Luxury lives in the details
        </h1>

        <p className="text-sm text-white/90 text-center mt-2 max-w-lg mx-auto">
         Intelligent layouts, premium materials, and engineered quiet make every square meter count.
Beauty that works better—and lasts longer.
        </p>

        <div className="example-row">
          <div className="example-block">
            <img
              className="h-full w-full object-cover object-center"
              src="https://images.unsplash.com/photo-1729086046027-09979ade13fd?q=80&h=800&w=800&auto=format&fit=crop"
              alt="image"
            />
          </div>

          <div className="example-block">
            <img
              className="h-full w-full object-cover object-right"
              src="https://images.unsplash.com/photo-1649265825072-f7dd6942baed?q=80&h=800&w=800&auto=format&fit=crop"
              alt="image"
            />
          </div>

          <div className="example-block">
            <img
              className="h-full w-full object-cover object-center"
              src="https://images.unsplash.com/photo-1719368472026-dc26f70a9b76?q=80&h=800&w=800&auto=format&fit=crop"
              alt="image"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
