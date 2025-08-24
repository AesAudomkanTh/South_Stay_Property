import React from "react";
import "./ImageGrid.css";

export default function ImageGrid() {
  const items = [
    { src: "https://images.unsplash.com/photo-1719368472026-dc26f70a9b76?q=80&w=736&auto=format&fit=crop", title: "Image Title", href: "#" },
    { src: "https://images.unsplash.com/photo-1649265825072-f7dd6942baed?q=80&w=798&auto=format&fit=crop", title: "Image Title", href: "#" },
    { src: "https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&w=687&auto=format&fit=crop", title: "Image Title", href: "#" },
    { src: "https://images.unsplash.com/photo-1729086046027-09979ade13fd?q=80&w=862&auto=format&fit=crop", title: "Image Title", href: "#" },
    { src: "https://images.unsplash.com/photo-1601568494843-772eb04aca5d?q=80&w=687&auto=format&fit=crop", title: "Image Title", href: "#" },
    { src: "https://images.unsplash.com/photo-1585687501004-615dfdfde7f1?q=80&w=703&auto=format&fit=crop", title: "Image Title", href: "#" },
    { src: "https://images.unsplash.com/photo-1719368472026-dc26f70a9b76?q=80&w=736&auto=format&fit=crop", title: "Image Title", href: "#" },
    { src: "https://images.unsplash.com/photo-1649265825072-f7dd6942baed?q=80&w=798&auto=format&fit=crop", title: "Image Title", href: "#" },
  ];

  return (
    <section className="gallery">
      <h1 className="gallery__title">Our Latest Creations</h1>
      <p className="gallery__subtitle">
        A visual collection of our most recent works - each piece crafted with intention, emotion, and style.
      </p>

      <div className="gallery__grid">
        {items.map((item, i) => (
          <figure className="card" key={i}>
            <img className="card__img" src={item.src} alt={item.title} loading="lazy" />
            <figcaption className="card__overlay">
              <h2 className="card__title">{item.title}</h2>
              <a className="card__link" href={item.href} aria-label={`Show more about ${item.title}`}>
                <span>Show More</span>
                <svg width="16" height="16" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M8.125 1.625H11.375V4.875" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.41602 7.58333L11.3743 1.625" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.75 7.04167V10.2917C9.75 10.579 9.63586 10.8545 9.4327 11.0577C9.22953 11.2609 8.95398 11.375 8.66667 11.375H2.70833C2.42102 11.375 2.14547 11.2609 1.9423 11.0577C1.73914 10.8545 1.625 10.579 1.625 10.2917V4.33333C1.625 4.04602 1.73914 3.77047 1.9423 3.5673C2.14547 3.36414 2.42102 3.25 2.70833 3.25H5.95833" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
