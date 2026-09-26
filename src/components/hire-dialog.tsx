import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/site-config";

export function HireDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    if (!open) { setCopied(false); setCopyError(false); }
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(siteConfig.fiverrUsername);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  return (
    <dialog ref={ref} className="hire-dialog" onClose={onClose} aria-labelledby="hire-title">
      <h2 id="hire-title">Start a project</h2>
      <p>
        Fiverr username: <strong>@{siteConfig.fiverrUsername}</strong>.
        {siteConfig.links.fiverr ? " Open the profile to discuss your project." : " My Fiverr profile is being completed. The enquiry link will be available here once it is live."}
      </p>
      <menu>
        {siteConfig.links.fiverr && <a className="cta" href={siteConfig.links.fiverr} target="_blank" rel="noopener noreferrer">
          Open Fiverr
        </a>}
        <button className="cta cta-ghost" type="button" onClick={copy}>
          {copied ? "Copied" : `Copy @${siteConfig.fiverrUsername}`}
        </button>
      </menu>
      <p role="status">{copyError ? `Copy unavailable. Select the username above: ${siteConfig.fiverrUsername}` : copied ? "Username copied." : ""}</p>
      <p className="hire-alts">
        <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </p>
    </dialog>
  );
}
