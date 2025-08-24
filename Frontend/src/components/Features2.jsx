import React from "react";
import { ShieldCheck, Search, Crown } from "lucide-react";
import "./Features2.css";

export default function Features2() {
  return (
    <section className="about about--dark" aria-labelledby="about-heading">
      <header className="about__header">
        <h1 id="about-heading" className="about__title">All the facts. Zero guesswork.</h1>
        <p className="about__subtitle">
          Verified listings with transparent fees and timelines. Real-time alerts surface hot deals, while customizable reports turn data into action—so you can move from search to keys with confidence.
        </p>
      </header>

      <ul className="about__grid" role="list">

        <li className="about-card about-card--violet">
          <span className="icon-pill icon--violet" aria-hidden="true">
            <ShieldCheck size={28} strokeWidth={2} color="#7F22FE" />
          </span>
          <div className="about-card__copy">
            <h3 className="about-card__title">Buy smart. Buy safe.</h3>
            <p className="about-card__text">Verified listings, transparent pricing, and instant viewings from search to handover.</p>
          </div>
        </li>


        <li className="about-card about-card--green">
          <span className="icon-pill icon--green" aria-hidden="true">
            <Search size={28} strokeWidth={2} color="#00A63E" />
          </span>
          <div className="about-card__copy">
            <h3 className="about-card__title">Smarter search.</h3>
            <p className="about-card__text">Compare projects with real-time data and close securely with e-contracts and escrow.</p>
          </div>
        </li>


        <li className="about-card about-card--orange">
          <span className="icon-pill icon--orange" aria-hidden="true">
            <Crown size={28} strokeWidth={2} color="#F54900" />
          </span>
          <div className="about-card__copy">
            <h3 className="about-card__title">Premium service</h3>
            <p className="about-card__text">Curated residences, private tours, and discreet, secure transactions.</p>
          </div>
        </li>
      </ul>
    </section>
  );
}
