import { useEffect, useRef, useState } from "react";
import { isReduced } from "@/hooks/motion-state";

type AskId = "bill" | "landlord";
type Phase = "home" | "plan" | "progress" | "done";

const ASKS: Record<
  AskId,
  { label: string; steps: [string, string, string]; needs: string; done: string }
> = {
  bill: {
    label: "Pay the electricity bill",
    steps: ["Read the last bill amount", "Use the saved electricity UPI", "Wait for the receipt"],
    needs: "Approve paying the electricity bill.",
    done: "Marked paid. Receipt noted.",
  },
  landlord: {
    label: "Remind me to call the landlord",
    steps: ["Find the landlord number on file", "Set a call reminder for today", "Keep it until you mark it done"],
    needs: "Approve setting the call reminder.",
    done: "Reminder set. Call is on the list.",
  },
};

export function DoPhone() {
  const [ask, setAsk] = useState<AskId | null>(null);
  const [phase, setPhase] = useState<Phase>("home");
  const [preview, setPreview] = useState(false);
  const timer = useRef<number>(0);
  const interacted = useRef(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const el = root.current;
    const wrap = el?.closest<HTMLElement>("[data-do-phone]");
    if (!el || !wrap) return;

    const stop = () => {
      interacted.current = true;
      setPreview(false);
    };

    const applyDwell = () => {
      if (interacted.current || isReduced()) return;
      const host = document.querySelector<HTMLElement>("[data-do-phone]");
      if (!host) return;
      const vis = Number.parseFloat(getComputedStyle(host).opacity) || 0;
      const dwell = host.dataset.dwell || "off";
      if (dwell !== "off" && vis < 0.45) return;
      if (dwell === "home") {
        setAsk(null);
        setPhase("home");
        setPreview(true);
      } else if (dwell === "plan") {
        setPreview(false);
        setAsk("bill");
        setPhase("plan");
      } else {
        setPreview(false);
      }
    };

    const mo = new MutationObserver(applyDwell);
    mo.observe(wrap, { attributes: true, attributeFilter: ["data-dwell", "data-pin"] });
    window.addEventListener("yk-do-dwell", applyDwell);
    applyDwell();
    el.addEventListener("pointerdown", stop);
    el.addEventListener("keydown", stop);
    return () => {
      mo.disconnect();
      window.removeEventListener("yk-do-dwell", applyDwell);
      el.removeEventListener("pointerdown", stop);
      el.removeEventListener("keydown", stop);
    };
  }, []);

  const job = ask ? ASKS[ask] : null;
  const onNow = phase !== "home";

  const goHome = () => {
    window.clearTimeout(timer.current);
    interacted.current = true;
    setPreview(false);
    setAsk(null);
    setPhase("home");
  };

  const start = (id: AskId) => {
    window.clearTimeout(timer.current);
    interacted.current = true;
    setPreview(false);
    setAsk(id);
    setPhase("plan");
  };

  const approve = () => {
    interacted.current = true;
    setPhase("progress");
    const wait = isReduced() ? 0 : 700;
    timer.current = window.setTimeout(() => setPhase("done"), wait);
  };

  return (
    <div className="phone" ref={root}>
      <div className="phone-bezel">
        <div className="phone-island" aria-hidden="true" />
        <div className="phone-screen">
          <div className="phone-bar">
            <span>9:41</span>
            <span className="phone-bar-sig" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>

          <div className="phone-screens" aria-live="polite">
            <div className={phase === "home" ? "is-on" : undefined} data-do-screen="home">
              <div className="phone-body">
                <p className="phone-eyebrow">Public prototype</p>
                <h3 className="phone-title">
                  What should DO <em>handle?</em>
                </h3>
                <p className="phone-copy">Interactive UI demo. No payments, reminders, or account connections.</p>
                <button className={preview ? "phone-card phone-ask is-preview" : "phone-card phone-ask"} type="button" onClick={() => start("bill")}>
                  <p className="phone-eyebrow accent">Request</p>
                  <h4>{ASKS.bill.label}</h4>
                </button>
                <button className="phone-card phone-ask" type="button" onClick={() => start("landlord")}>
                  <p className="phone-eyebrow accent">Request</p>
                  <h4>{ASKS.landlord.label}</h4>
                </button>
              </div>
            </div>

            <div className={onNow ? "is-on" : undefined} data-do-screen="now">
              <div className="phone-body">
                {phase === "plan" && job && (
                  <>
                    <p className="phone-eyebrow accent">Needs you</p>
                    <h3 className="phone-title">{job.label}</h3>
                    <p className="phone-copy">{job.needs}</p>
                    <ol className="phone-steps">
                      {job.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <button className="phone-btn" type="button" onClick={approve}>
                      Approve
                    </button>
                  </>
                )}
                {phase === "progress" && job && (
                  <>
                    <p className="phone-eyebrow">In progress</p>
                    <h3 className="phone-title">
                      Carrying it <em>out.</em>
                    </h3>
                    <p className="phone-copy">Showing the next step in this local UI simulation.</p>
                    <div className="phone-row">
                      <span>{job.label}</span>
                      <span className="state watching">In progress</span>
                    </div>
                  </>
                )}
                {phase === "done" && job && (
                  <>
                    <p className="phone-eyebrow">Done</p>
                    <h3 className="phone-title">
                      Demo <em>complete.</em>
                    </h3>
                    <div className="phone-card needs">
                      <p className="phone-eyebrow accent">Simulated result</p>
                      <h4>{job.done}</h4>
                    </div>
                    <button className="phone-btn ghost" type="button" onClick={goHome}>
                      Another request
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="phone-tabs">
            <button type="button" data-do-tab="home" className={phase === "home" ? "is-active" : undefined} onClick={goHome}>
              Home
            </button>
            <button
              type="button"
              data-do-tab="now"
              className={onNow ? "is-active" : undefined}
              disabled={!job}
              onClick={() => job && phase === "home" && setPhase("plan")}
            >
              Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
