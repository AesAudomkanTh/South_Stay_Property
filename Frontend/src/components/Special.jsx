import React from "react";
import { BadgeCheck, CalendarClock, Crown } from "lucide-react"; 
import "./Special.css";

export default function Special() {
  return (
    <section className="special special--dark" aria-labelledby="special-heading">
      <div className="special__blur" aria-hidden="true" />

      <ul className="special__grid" role="list">
        
        <li className="feature">
          <span className="icon-pill icon--violet" aria-hidden="true">
            <BadgeCheck size={28} strokeWidth={2} className="icon-svg" />
          </span>
          <div className="feature__copy">
            <h3 className="feature__title">Verified Listings Only</h3>
            <p className="feature__text">Ownership, permits, and specs checked before you see them.</p>
          </div>
        </li>

        
        <li className="feature">
          <span className="icon-pill icon--green" aria-hidden="true">
            <CalendarClock size={28} strokeWidth={2} className="icon-svg" />
          </span>
          <div className="feature__copy">
            <h3 className="feature__title">Book & Tour, Fast</h3>
            <p className="feature__text">Real-time slots, live chat with agents, smart route guidance.</p>
          </div>
        </li>

        
        <li className="feature">
          <span className="icon-pill icon--orange" aria-hidden="true">
            <Crown size={28} strokeWidth={2} className="icon-svg" />
          </span>
          <div className="feature__copy">
            <h3 className="feature__title">Curated Residences</h3>
            <p className="feature__text">Iconic addresses, premium materials, timeless design.</p>
          </div>
        </li>
      </ul>
    </section>
  );
}
