const checks = [
  [
    "01",
    "Search & metadata",
    "Page titles, descriptions, canonical URLs, and indexing directives.",
  ],
  [
    "02",
    "Sharing & discovery",
    "Social preview tags, site icons, and structured data syntax.",
  ],
  [
    "03",
    "Access & delivery",
    "Image alternatives, page landmarks, HTML size, and response headers.",
  ],
  [
    "04",
    "Security & site files",
    "HTTPS, security headers, robots.txt, sitemap.xml, and security contacts.",
  ],
];
export default function FeatureList() {
  return (
    <section id="checks" className="checks-section">
      <div className="checks-intro">
        <span className="eyebrow">THE CHECKLIST</span>
        <h2>
          Small details.
          <br />A better launch.
        </h2>
        <p>
          One page, checked from the outside. A useful first pass before you put
          your work out into the world.
        </p>
        <span className="scope-note">
          HTML checks, not a full browser audit.
        </span>
      </div>
      <div className="check-list">
        {checks.map(([number, title, description]) => (
          <div className="check-row" key={number}>
            <span className="check-number">{number}</span>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <span className="check-arrow" aria-hidden="true">
              ↗
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
