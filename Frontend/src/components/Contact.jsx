import React, { useState, useEffect } from "react";
import "./Contact.css";

export default function Contact({
  heroImage = "https://www.unlockmen.com/wp-content/uploads/2023/05/230530-5-Bedroom-web-pic4.jpg",
  phones = ["+66 90-000-0000", "+66 80-000-0000"],
  emails = ["6710210433@psu.ac.th", "6710210475@psu.ac.th"],
  address = "SOUTHSTAY HQ, Bangkok, Thailand",
  mapSrc = "https://www.google.com/maps?q=bangkok&output=embed",
}) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
  
    document.body.classList.add("contact-body-dark");
    return () => document.body.classList.remove("contact-body-dark");
  }, []);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setSending(true);
    setTimeout(() => {
      alert("ส่งข้อความเรียบร้อย! เราจะติดต่อกลับโดยเร็ว");
      setSending(false);
      setForm({ name: "", email: "", message: "" });
    }, 800);
  };

  return (
    <main className="contact-page">
      
      <section
        className="contact-hero hero--vivid"
        style={{ "--hero": `url(${heroImage})` }}
      >
        <div className="hero-overlay">
          <h1 className="hero-title">Contact Us</h1>
          <nav className="breadcrumbs">
            <a href="/">Home</a>
            <span>/</span>
            <span>Contact Us</span>
          </nav>
        </div>
      </section>

      
      <section className="wrap contact-cards">
        <div className="contact-card">
          <div className="cc-head">
            <IconPhone />
            <h3>Call Us</h3>
          </div>
          <ul>
            {phones.map((p, i) => (
              <li key={i}><a href={`tel:${p.replace(/\s/g, "")}`}>{p}</a></li>
            ))}
          </ul>
        </div>

        <div className="contact-card">
          <div className="cc-head">
            <IconMail />
            <h3>Email Us</h3>
          </div>
          <ul>
            {emails.map((m, i) => (
              <li key={i}><a href={`mailto:${m}`}>{m}</a></li>
            ))}
          </ul>
        </div>

        <div className="contact-card">
          <div className="cc-head">
            <IconMap />
            <h3>Address</h3>
          </div>
          <p className="muted">{address}</p>
        </div>
      </section>

     
      <section className="wrap map-form">
        <div className="map-wrap">
          <iframe
            title="Map"
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <form className="contact-form" onSubmit={onSubmit} noValidate>
          <label className="field">
            <span>Name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              required
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="field">
            <span>Message</span>
            <textarea
              name="message"
              rows="6"
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us what you need…"
              required
            />
          </label>

          <button className="btn-send" type="submit" disabled={sending}>
            {sending ? "Sending…" : "Send Message"}
          </button>
        </form>
      </section>
    </main>
  );
}


function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.7 19.7 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.15 12.8 19.7 19.7 0 0 1 .08 4.37 2 2 0 0 1 2.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L6.1 9.9a16 16 0 0 0 8 8l1.45-1.14a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
      <path d="m22 6-10 7L2 6"/>
    </svg>
  );
}
function IconMap() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3V6z"/>
      <path d="M8 3v15M16 6v15"/>
    </svg>
  );
}
