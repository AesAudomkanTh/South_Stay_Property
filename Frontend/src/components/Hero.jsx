import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <div className="hero-container bg-black ">
      <div className="hero-text">
        <h1 className="hero-heading">Elevate your lifestyle</h1>

        <p className="hero-description">
          A hand-picked collection of high-end residences in iconic addresses. Private tours and discreet service.
        </p>

        <div className="flex items-center gap-4 mt-6">
  <button
    className="flex items-center gap-2 hero-cta hero-cta--light px-8 py-3 mt-2 rounded-full transition"
  >
    <span>get started for free</span>
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
         xmlns="http://www.w3.org/2000/svg">
      <path d="M4.166 10h11.667m0 0L9.999 4.167M15.833 10l-5.834 5.834"
            stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>
</div><br />

        <p className="hero-note">Request a private tour.</p>

        <div className="hero-avatars">
          <div className="hero-avatar-group">
            {[
              "photo-1633332755192-727a05c4013d",
              "photo-1535713875002-d1d0cf377fde",
              "photo-1438761681033-6461ffad8d80",
              "photo-1522075469751-3a6694fb2f61",
              "photo-1527980965255-d3b416303d12",
            ].map((id, i) => (
              <img
                key={i}
                src={`https://images.unsplash.com/${id}?w=200&auto=format&fit=crop&q=80`}
                alt="avatar"
                className="hero-avatar"
              />
            ))}
          </div>
          <div>
            <div className="hero-stars">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="13" height="12" viewBox="0 0 13 12" fill="none"
                     xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5.85536 0.463527C6.00504 0.00287118 6.65674 0.00287028 6.80642 0.463526L7.82681 3.60397C7.89375 3.80998 8.08572 3.94946 8.30234 3.94946H11.6044C12.0888 3.94946 12.2901 4.56926 11.8983 4.85397L9.22687 6.79486C9.05162 6.92219 8.97829 7.14787 9.04523 7.35388L10.0656 10.4943C10.2153 10.955 9.68806 11.338 9.2962 11.0533L6.62478 9.11244C6.44954 8.98512 6.21224 8.98512 6.037 9.11244L3.36558 11.0533C2.97372 11.338 2.44648 10.955 2.59616 10.4943L3.61655 7.35388C3.68349 7.14787 3.61016 6.92219 3.43491 6.79486L0.763497 4.85397C0.37164 4.56927 0.573027 3.94946 1.05739 3.94946H4.35944C4.57606 3.94946 4.76803 3.80998 4.83497 3.60397L5.85536 0.463527Z"
                    fill="#FF8F20"
                  />
                </svg>
              ))}
            </div>
            <p className="hero-user-count">Used by 1,000+ people</p>
          </div>
        </div>
      </div>

      <div className="hero-image-container">
        <div className="hero-image-bg"></div>
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1681949222860-9cb3b0329878?q=80&w=450&h=560&auto=format&fit=crop"
          alt="hero"
        />
      </div>
    </div>
  );
};

export default Hero;
