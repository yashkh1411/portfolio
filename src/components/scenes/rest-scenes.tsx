import { siteConfig } from "@/lib/site-config";
import { FinChart } from "@/components/fin-chart";
import { RoamExperience } from "@/components/roam-experience";

export function WorkIndex() {
  return (
    <section className="chapter idea" id="work" aria-labelledby="selected-title" data-theme-on="paper" data-idea data-work>
      <p className="kicker" data-work-in>
        Work
      </p>
      <h2 id="selected-title" data-work-in>
        What I can <em>build.</em>
      </h2>
      <p className="cap-line" data-cap-line data-work-in>
        <span data-cap-word="0">AI systems</span>
        <span data-cap-word="1">Product engineering</span>
        <span data-cap-word="2">Architecture</span>
        <span data-cap-word="3">Security</span>
      </p>
      <i className="work-spine" data-work-spine aria-hidden="true" />
      <svg className="sys-org" data-sys-org viewBox="0 0 640 160" aria-hidden="true">
        <path data-org-link d="M40 80 H600" />
        <path data-org-link d="M120 80 V36 H240" />
        <path data-org-link d="M320 80 V124 H440" />
        <path data-org-link d="M240 36 H520 V80" />
        <circle data-org-node cx="40" cy="80" r="5" />
        <circle data-org-node cx="120" cy="80" r="5" />
        <circle data-org-node cx="240" cy="36" r="5" />
        <circle data-org-node cx="320" cy="80" r="5" />
        <circle data-org-node cx="440" cy="124" r="5" />
        <circle data-org-node cx="520" cy="80" r="5" />
        <circle data-org-node cx="600" cy="80" r="5" />
        <rect data-org-panel x="200" y="22" width="240" height="116" rx="2" />
      </svg>
      <nav className="work-index" aria-label="Selected work">
        <a href="#do" data-work-in className="has-preview is-current">
          <span className="wi-n">01</span>
          <span className="wi-name">
            Project DO
            <i className="wi-tick" aria-hidden="true" />
            <span className="sr-only">Current work</span>
          </span>
          <p className="wi-outcome">Request → review → action.</p>
          <span className="wi-meta">Public prototype</span>
          <span className="wi-tags">AI agents · full-stack · product UI</span>
          <img className="wi-preview" src="/assets/do-phone.png" alt="" width={180} height={120} loading="lazy" decoding="async" />
        </a>
        <a href="#finpulse" data-work-in>
          <span className="wi-n">02</span>
          <span className="wi-name">FinPulse X</span>
          <p className="wi-outcome">See where the money goes.</p>
          <span className="wi-meta">Engineering prototype</span>
          <span className="wi-tags">Spending patterns · React · Python</span>
        </a>
        <a href="#roam" data-work-in>
          <span className="wi-n">03</span>
          <span className="wi-name">ROAM OS</span>
          <p className="wi-outcome">Plan. Translate. Navigate.</p>
          <span className="wi-meta">Product exploration</span>
          <span className="wi-tags">Trip planning · maps · translation</span>
        </a>
      </nav>
    </section>
  );
}

export function FinPulseScene() {
  return (
    <section className="chapter case fin-chapter" id="finpulse" aria-labelledby="finpulse-title" data-theme-on="paper">
      <div className="finance-layout">
        <div className="finance-editorial">
          <p className="visual-label">02 / FinPulse X</p>
          <h2 id="finpulse-title">Understand<br /><em>your spending.</em></h2>
          <p className="visual-status">Engineering prototype · sample week · not a bank.</p>
        </div>
        <FinChart />
      </div>
    </section>
  );
}

export function RoamScene() {
  return (
    <section className="chapter roam-chapter visual-roam" id="roam" aria-labelledby="roam-title" data-theme-on="paper">
      <RoamExperience />
      <details className="build-notes travel-build">
        <summary>Project details</summary>
        <p className="body">ROAM OS explores an AI travel companion: trip intelligence, voice translation, maps and location awareness. This portfolio sequence is an interactive product concept, not a recording of the application.</p>
        <p className="body">The itinerary and phrase are examples. Map streets and landmark positions come from OpenStreetMap; connecting lines show the stop order, not road directions. Live translation and navigation are not connected. Authentic application screens can replace these concept panels when available.</p>
      </details>
    </section>
  );
}

export function ApproachScene() {
  return (
    <section className="chapter" id="approach" aria-labelledby="approach-title" data-theme-on="paper" data-approach>
      <div className="approach-pin">
      <p className="kicker" data-approach-in>
        How I build
      </p>
      <h2 id="approach-title" data-approach-in>
        From brief to build.
      </h2>
      <div className="proc-object" data-proc-object aria-hidden="true">
        {["Brief", "UX", "UI", "API", "Data", "AI", "Testing", "Handoff"].map((part) => <i key={part} data-proc-bit>{part}</i>)}
        <i data-proc-line aria-hidden="true" />
        <b data-proc-frame>One connected product</b>
      </div>
      <ul className="proof method">
        <li data-approach-in>
          <span>01</span>
          Scope the job
        </li>
        <li data-approach-in>
          <span>02</span>
          Design the system
        </li>
        <li data-approach-in>
          <span>03</span>
          Build the product
        </li>
        <li data-approach-in>
          <span>04</span>
          Hand it over
        </li>
      </ul>
      </div>
    </section>
  );
}

export function AboutScene() {
  return (
    <section className="chapter" id="about" aria-labelledby="about-title" data-theme-on="paper">
      <div className="about-grid">
        <picture data-reveal>
          <source
            type="image/webp"
            srcSet="/portraits/about-800.webp 800w, /portraits/about-1600.webp 1600w"
            sizes="(max-width: 767px) 100vw, 42vw"
          />
          <img
            className="about-photo"
            src="/portraits/about.jpg"
            width={960}
            height={1280}
            alt="Yash leaning against a mossed stone wall in a denim jacket and cargo trousers"
            loading="lazy"
            decoding="async"
          />
        </picture>
        <div>
          <p className="kicker" data-reveal>
            About
          </p>
          <h2 id="about-title" data-reveal>
            Yash Khairwal.<br /><em>AI &amp; full-stack.</em>
          </h2>
          <p className="body" data-reveal>
            AI agents. Useful interfaces. Connected systems.
          </p>
          <p className="body about-meta" data-reveal>
            {siteConfig.location}
            <br />
            {siteConfig.education}
          </p>
          <div className="hero-actions about-links" data-reveal>
            <a className="cta cta-ghost" href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a className="cta cta-ghost" href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ onHire }: { onHire: () => void }) {
  return (
    <section className="final-cta" id="contact" aria-labelledby="cta-title" data-yk-end>
      <h2 id="cta-title" className="sr-only">
        Contact
      </h2>
      <div className="yk-stage" data-yk-stage>
        <canvas className="yk-burst" data-yk-burst aria-hidden="true" />
        <div className="yk-field" data-yk-field aria-hidden="true">
          {YK_FIELD.map(([x, y, s], i) => (
            <i key={i} style={{ left: `${x}%`, top: `${y}%`, transform: `scale(${s})` }} />
          ))}
        </div>
        <div className="yk-sign" data-yk-sign aria-hidden="true">
          <svg viewBox="0 0 220 160" fill="none">
            <path
              className="yk-stroke"
              data-yk-y
              pathLength="1"
              d="M18 18 L70 92 L70 148 M70 92 L122 18"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            <path
              className="yk-stroke yk-k"
              data-yk-k
              pathLength="1"
              d="M148 18 L148 148 M148 84 L204 18 M148 84 L204 148"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>
        </div>
        <div className="yk-star" data-yk-star aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none">
            <path
              d="M32 2 L34.4 29.6 L62 32 L34.4 34.4 L32 62 L29.6 34.4 L2 32 L29.6 29.6 Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>
        </div>
        <div className="gate-board" data-gate-board>
          <p className="gate-head" data-flap>
            GATE 01
          </p>
          <button
            className="gate-row"
            data-flap
            type="button"
            onClick={onHire}
          >
            <span>Fiverr</span>
            <b>{siteConfig.fiverrUsername}</b>
          </button>
          <a
            className="gate-row"
            data-flap
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>GitHub</span>
            <b>yashkh1411</b>
          </a>
          <p className="gate-row" data-flap>
            <span>Delhi</span>
            <b>IST</b>
          </p>
          <button className="gate-copy" type="button" onClick={onHire} data-flap>
            Start a project
          </button>
        </div>
      </div>
    </section>
  );
}

const YK_FIELD: Array<[number, number, number]> = [
  [8, 12, 0.7],
  [18, 28, 0.45],
  [27, 8, 0.9],
  [41, 18, 0.5],
  [58, 10, 0.65],
  [72, 22, 0.4],
  [86, 14, 0.8],
  [92, 36, 0.5],
  [6, 48, 0.55],
  [14, 72, 0.7],
  [24, 88, 0.4],
  [48, 82, 0.6],
  [68, 76, 0.45],
  [82, 68, 0.85],
  [90, 86, 0.5],
  [36, 64, 0.35],
];
