import React from "react";
import "./About.css";
import Boss from "../assets/Bossss.jpg";
import Aes from "../assets/Aessss.jpg";



export default function About({
  heroImage = "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2000&auto=format&fit=crop",
  stats = [
    { value: "352", label: "Projects Completed" },
    { value: "567", label: "Satisfied Clients" },
    { value: "656 M", label: "Monthly Revenue" },
    { value: "17", label: "Awards Won" },
  ],
  features = [
    {
      title: "Architecture",
      text: "Modern architecture that balances function and beauty.",
      image:
        "https://media.sbdesignsquare.com/media/wysiwyg/SB4-11_2.jpg",
    },
    {
      title: "Interior Design",
      text: "Interiors that reflect who you are beautiful",
      image:
        "https://www.fivestarbuildin.com/wp-content/uploads/2024/06/Untitled-design-43.png",
    },
    {
      title: "3D Modeling",
      text: "Photoreal 3D modeling for clear decisions before construction.",
      image:
        "https://img.lovepik.com/bg/20240105/Luxurious-Home-with-a-Pool-and-Stylish-Lounge-Area_2726185_wh1200.jpg",
    },
  ],
  team = [
    { name: "Bryant Boss", role: "General Manager", photo: Boss },
    { name: "Aespexke", role: "Founder", photo: Aes },
  ],
}) {
  return (
    <main className="about-page">


      <section
        className="about-hero"
        style={{ ["--hero"]: `url(${heroImage})` }}
      >
        <div className="hero-overlay">
          <h1 className="hero-title">About Us</h1>
          <nav className="breadcrumbs">
            <a href="/">Home</a>
            <span>/</span>
            <span>About Us</span>
          </nav>
        </div>
      </section>



      <section className="wrap stats-area">
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="stat">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <article className="about-text">
          <p>
            Your next home, without the headache.
            I’m building a smarter real-estate marketplace that blends design, construction know-how, and modern tech—so buyers and sellers move faster, safer, and with total clarity.
          </p>
          <p>
            I’m an IT-driven real-estate maker. I combine design thinking, real construction insight, and reliable technology to upgrade the property journey—from curated listings and clear pricing to seamless communication and on-time closings. My goal is simple: elevate life for clients and communities through better property experiences.
          </p>
        </article>
      </section>


      <section className="wrap">
        <h2 className="section-title">Best Features.</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <article key={i} className="feature-card">
              <div className="feature-head">
                <svg
                  className="feature-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3 12l9-9 9 9" />
                  <path d="M4 10v10h6v-6h4v6h6V10" />
                </svg>
                <h3>{f.title}</h3>
              </div>
              <p className="feature-text">{f.text}</p>
              <div
                className="feature-image"
                style={{ backgroundImage: `url(${f.image})` }}
                aria-hidden
              />
              <button className="link-ghost" type="button">
                Read More
                <svg viewBox="0 0 24 24" width="18" height="18" className="arrow">
                  <path fill="currentColor" d="M10 17l5-5-5-5v10zM4 19h2V5H4v14z" />
                </svg>
              </button>
            </article>
          ))}
        </div>
      </section>


      <section className="team-band">
        <div className="wrap">
          <h2 className="section-title center">Creative Team.</h2>
          <div className="team-grid">
            {team.map((t, i) => (
              <figure key={i} className="team-card">
                <div
                  className="team-photo"
                  style={{ backgroundImage: `url(${t.photo})` }}
                  aria-label={t.name}
                />
                <figcaption>
                  <div className="team-name">{t.name}</div>
                  <div className="team-role">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
