import React from "react";
import { BadgeCheck, Receipt, CalendarClock } from "lucide-react";
import "./Features.css";

export default function Features() {
  return (
    <section className="features features--dark " aria-labelledby="features-heading">
      <h2 id="features-heading" className="sr-only">Product Features</h2>

      {/* Option A: local asset in /public/images */}
      {/* <img
        className="features__image"
        src="/images/luxury-interior.jpg"
        alt="Luxury living room interior with warm wood, marble, and soft lighting"
        loading="lazy"
        decoding="async"
        width="1600"
        height="1067"
        sizes="(max-width: 900px) 100vw, 50vw"
      /> */}

      {/* Option B: royalty-free Unsplash image (no account needed) */}
      <img
        className="features__image"
        src="https://images.unsplash.com/phhttps://sumesshmenonassociates.com/wp-content/uploads/2020/10/essentials-for-luxury-home-interiors-banner-new.webpoto-1505692794403-34d4982f88aa?auto=format&fit=crop&w=1600&q=80"
        srcSet="
         https://ychef.files.bbci.co.uk/1280x720/p0h9k5dl.jpg"
        alt="Luxury living room interior with warm wood, marble, and soft lighting"
        loading="lazy"
        decoding="async"
        width="1600"
        height="1067"
        sizes="(max-width: 900px) 100vw, 50vw"
      />

      <ul className="feature-list" role="list">

        <li className="feature-item">
          <span className="icon-pill icon--violet" aria-hidden="true">
            <BadgeCheck size={28} strokeWidth={2} className="icon-svg" />
          </span>
          <div className="feature-copy">
            <h3 className="feature-title">Verified Listings</h3>
            <p className="feature-text">Every property checked for accuracy, ownership, and legal status.</p>
          </div>
        </li>


        <li className="feature-item">
          <span className="icon-pill icon--green" aria-hidden="true">
            <Receipt size={28} strokeWidth={2} className="icon-svg" />
          </span>
          <div className="feature-copy">
            <h3 className="feature-title">Transparent Pricing</h3>
            <p className="feature-text">Real prices with fees upfront—no surprises.</p>
          </div>
        </li>


        <li className="feature-item">
          <span className="icon-pill icon--orange" aria-hidden="true">
            <CalendarClock size={28} strokeWidth={2} className="icon-svg" />
          </span>
          <div className="feature-copy">
            <h3 className="feature-title">Instant Viewings</h3>
            <p className="feature-text">Book on your schedule with live chat and route guidance.</p>
          </div>
        </li>
      </ul>
    </section>
  );
}
