import { DoPhone } from "@/components/do-phone";

export function DoScene() {
  return (
    <>
      <section
        className="void-scene do-track"
        id="do"
        aria-label="Project DO"
        data-do-track
        data-theme-on="void"
      >
        <div className="do-pin" data-do-pin data-phase="intro">
          <div className="do-frame" data-frame="intro">
            <p className="do-kicker" data-do-kicker>
              01 / Project DO · simulated walkthrough
            </p>
            <p className="do-line" data-do-a>
              AI can answer.
            </p>
            <p className="do-line ask" data-do-b>
              But can it act?
            </p>
            <p className="do-mark" data-do-mark>
              DO
            </p>
          </div>

          <div className="do-frame" data-frame="request">
            <p className="do-req" data-do-req>
              Pay the electricity bill
            </p>
          </div>

          <div className="do-frame" data-frame="exec">
            <p className="do-req do-req-small">Pay the electricity bill</p>
            <div className="do-rails" data-do-rails>
              <article data-rail="0">
                <span>Confirm amount</span>
                <b>In progress</b>
              </article>
              <article data-rail="1" data-gate>
                <span>Approve payment</span>
                <b>Needs you</b>
              </article>
              <article data-rail="2">
                <span>Wait for receipt</span>
                <b>
                  Waiting
                  <i className="wait-orbit" aria-hidden="true" />
                </b>
              </article>
              <article data-rail="3">
                <span>Mark paid</span>
                <b>Verify</b>
                <i className="verify-scan" aria-hidden="true" />
              </article>
              <article data-rail="4">
                <span>Marked paid. Receipt noted.</span>
                <b>Done</b>
              </article>
            </div>
          </div>

          <div className="do-frame" data-frame="phone">
            <div className="do-phone-wrap" data-do-phone>
              <DoPhone />
            </div>
            <p className="do-caption" data-do-caption>
              Interactive UI simulation · no live actions
            </p>
          </div>
        </div>
      </section>

      <section className="chapter case do-evidence" id="do-evidence" aria-labelledby="do-ev-title" data-theme-on="obsidian" data-case>
        <div className="flag-pin">
          <p className="kicker" data-flagship>01 / Flagship</p>
          <h2 id="do-ev-title" data-flagship>
            <span data-flagship-line>From request</span>
            <span data-flagship-line>to reviewed action.</span>
          </h2>
          <p className="lede" data-flagship>You approve. The phone shows a done line.</p>
          <ol className="arch-flow flagship-flow" data-flagship aria-label="Public product concept">
            <li>Understand</li><li>Plan</li><li>Act</li><li>Watch</li><li>Verify</li>
          </ol>
          <i className="flagship-rule" data-flagship-rule aria-hidden="true" />
          <p className="status" data-flagship><i /> Public prototype · local simulation</p>
          <a className="cta-line" href="#do">Try the demo <span aria-hidden="true">↑</span></a>
        </div>
      </section>
    </>
  );
}
