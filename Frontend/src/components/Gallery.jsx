
import React from 'react';
import './Gallery.css';

export default function Gallery() {
  return (
    <div className="gallery-container gallery--dark">
      <h1 className="text-3xl font-semibold text-center mx-auto text-white">
        Premium Finishes
      </h1>

      <p className="text-sm text-white/90 text-center mt-2 max-w-lg mx-auto">
        Handpicked materials, seamless cabinetry, soft-close hardware.
        Moisture- & scratch-resistant surfaces—beauty that lasts.
      </p>
      <br />
      <div className="flex flex-wrap items-center justify-center mt-10 mx-auto gap-4">
        <img
          className="gallery-image"
          src="https://img.freepik.com/premium-photo/background-image-with-marble-pattern-dark-colors_465502-2435.jpg"
          alt="Gallery Image 1"
        />
        <img
          className="gallery-image"
          src="https://img.freepik.com/premium-photo/gold-black-marble-wallpaper-that-is-great-wallpaper-your-home_345220-639.jpg"
          alt="Gallery Image 2"
        />
        <img
          className="gallery-image"
          src="https://plus.unsplash.com/premium_photo-1671209879721-3082e78307e3?q=80&w=600&h=900&auto=format&fit=crop"
          alt="Gallery Image 3"
        />
        <img
          className="gallery-image"
          src="https://img.freepik.com/premium-photo/green-marble-wallpaper-that-says-gold-it_826801-293.jpg"
          alt="Gallery Image 4"
        />
      </div>
    </div>
  );
}
