import { siteConfig } from "@/lib/site-config";

export function SiteHeader({ onHire }: { onHire: () => void }) {
  const live = Boolean(siteConfig.links.fiverr);
  return (
    <header className="site-header">
      <a className="brand-mark" href="#top" aria-label={`${siteConfig.name} — home`}>
        YK
      </a>
      <nav className="header-nav" aria-label="Primary">
        <a href="#work">Work</a>
        <a href="#approach">Capabilities</a>
        <a href="#about">About</a>
        {live ? (
          <a aria-label="Start a project" className="nav-cta" href={siteConfig.links.fiverr} target="_blank" rel="noopener noreferrer">
            <span className="nav-cta-full">Start a project</span>
            <span className="nav-cta-short" aria-hidden="true">
              Contact
            </span>
          </a>
        ) : (
          <button aria-label="Start a project" className="nav-cta" type="button" onClick={onHire}>
            <span className="nav-cta-full">Start a project</span>
            <span className="nav-cta-short" aria-hidden="true">
              Contact
            </span>
          </button>
        )}
      </nav>
    </header>
  );
}