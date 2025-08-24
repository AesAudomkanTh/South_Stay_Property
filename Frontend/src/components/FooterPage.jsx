import React from "react";
import "./FooterPage.css";

export default function FooterPage() {
  return (
    <div className="footer-page">
      <footer className="footer">
        <div className="wrap footer-grid">
          {/* Contact */}
          <div className="fcol">
            <h3 className="ftitle">Contact Us</h3>

            <div className="frow">
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M12 22s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12z" />
                <circle cx="12" cy="10" r="2.6" />
              </svg>
              <div>
                <div className="fstrong">Official Address</div>
                <div className="fmuted">SOUTHSTAY HQ, Bangkok, Thailand</div>
              </div>
            </div>

            <div className="frow">
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
              <div>
                <div className="fstrong">Email Us</div>
                <a className="flink" href="mailto:contact@southstay.co">
                  contact@southstay.co
                </a>
              </div>
            </div>

            <div className="frow">
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.7 19.7 0 0 1 11.2 19 19.5 19.5 0 0 1 5 12.8 19.7 19.7 0 0 1 2.08 4.37 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 8 8l1.45-1.14a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z" />
              </svg>
              <div>
                <div className="fstrong">Call Us</div>
                <a className="flink" href="tel:+66900000000">
                  +66 90-000-0000
                </a>
              </div>
            </div>
          </div>

          {/* Recent News */}
          <div className="fcol">
            <h3 className="ftitle">Recent News</h3>
            <ul className="newslist">
              <li className="newsitem">
                <img
                  src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=300&auto=format&fit=crop"
                  alt=""
                />
                <div>
                  <a className="flink" href="#">
                    The Start-Up Ultimate Guide to Make Your Real-Estate Journal.
                  </a>
                  <div className="fdate">14 Jun 2025</div>
                </div>
              </li>
              <li className="newsitem">
                <img
                  src="https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=300&auto=format&fit=crop"
                  alt=""
                />
                <div>
                  <a className="flink" href="#">
                    Market Insights: Urban Living 2025.
                  </a>
                  <div className="fdate">11 Jun 2025</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Brand + Socials */}
          <div className="fcol brandcol">
            <div className="brand">SOUTH STAY</div>
            <div className="socials">
              <a href="#" aria-label="Facebook">
                f
              </a>
              <a href="#" aria-label="Twitter">
                t
              </a>
              <a href="#" aria-label="Instagram">
                ◎
              </a>
              <a href="#" aria-label="YouTube">
                ▶
              </a>
            </div>
            <p className="copy">
              © 2025, ARCH TEMPLATE. MADE WITH <br />
              PASSION BY <span className="gold">THEMESCAMP</span>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
