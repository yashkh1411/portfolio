import { useEffect, useId, useRef, useState } from "react";

// Synthetic observations, never a bank feed or a claim about a client's results.
const sample = [
  { day: "Monday", amount: 420 },
  { day: "Tuesday", amount: 610 },
  { day: "Wednesday", amount: 340 },
  { day: "Thursday", amount: 780 },
  { day: "Friday", amount: 520 },
  { day: "Saturday", amount: 1480 },
  { day: "Sunday", amount: 690 },
];
const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const sum = sample.reduce((total, point) => total + point.amount, 0);

export function FinChart() {
  const id = useId().replace(/:/g, "");
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [selected, setSelected] = useState(5);
  const [cumulative, setCumulative] = useState(false);
  const [exploring, setExploring] = useState(false);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(200, entry.contentRect.width)));
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  const values = sample.map((point, index) => ({
    ...point,
    value: cumulative ? sample.slice(0, index + 1).reduce((total, p) => total + p.amount, 0) : point.amount,
  }));
  const ceiling = Math.ceil(Math.max(...values.map((p) => p.value)) / 1000) * 1000;
  const left = width > 500 ? 48 : 32, right = width - (width > 500 ? 25 : 12), top = 22, bottom = 230;
  const band = (right - left) / 7;
  const x = (i: number) => left + band * (i + .5);
  const y = (value: number) => bottom - value / ceiling * (bottom - top);
  const choose = (index: number) => { setSelected(index); setExploring(true); };
  const current = values[selected];

  return (
    <div className="finance-console" data-fin-chart data-exploring={exploring || undefined}>
      <header className="finance-console-head">
        <div><span className="visual-label">What did this week cost?</span><p className="finance-total">{money(sum)}<span>spent across 7 days · sample data</span></p></div>
        <span className="sample-badge">Illustrative data</span>
      </header>
      <div className="finance-toolbar">
        <div className="chart-modes" role="group" aria-label="Chart view">
          <button type="button" aria-pressed={!cumulative} onClick={() => { setCumulative(false); setExploring(true); }}>Each day</button>
          <button type="button" aria-pressed={cumulative} onClick={() => { setCumulative(true); setExploring(true); }}>Total so far</button>
        </div>
        <p className="finance-reading">Select a day to explore.</p>
      </div>
      <div className="finance-plot" ref={host}>
        <svg viewBox={`0 0 ${width} 260`} role="img" aria-labelledby={`${id}-title ${id}-desc`}
          onPointerMove={(event) => {
            if (event.pointerType === "touch" && !event.buttons) return;
            const r = event.currentTarget.getBoundingClientRect();
            choose(Math.max(0, Math.min(6, Math.floor(((event.clientX - r.left) * width / r.width - left) / band))));
          }}
          onPointerDown={(event) => {
            const r = event.currentTarget.getBoundingClientRect();
            choose(Math.max(0, Math.min(6, Math.floor(((event.clientX - r.left) * width / r.width - left) / band))));
          }}>
          <title id={`${id}-title`}>{`${cumulative ? "Cumulative" : "Daily"} sample spending in rupees, Monday to Sunday`}</title>
          <desc id={`${id}-desc`}>Each bar shows spending in rupees. Orange marks the selected day. Total so far adds each day's spending to the previous days. Use the day buttons or the data table for exact values.</desc>
          <defs>
            <clipPath id={`${id}-reveal`}><rect data-fin-reveal width="100%" height="260" /></clipPath>
          </defs>
          {[0, 1, 2, 3, 4].map((step) => <g key={step} className="finance-axis">
            <line x1={left} x2={right} y1={y(ceiling * step / 4)} y2={y(ceiling * step / 4)} />
            <text x={left - 10} y={y(ceiling * step / 4) + 4} textAnchor="end">{ceiling * step / 4 >= 1000 ? `${ceiling * step / 4000}k` : ceiling * step / 4}</text>
          </g>)}
          <text className="finance-unit" x="0" y="12">INR</text>
          <g className="finance-series" clipPath={`url(#${id}-reveal)`}>
            {values.map((p, i) => {
              const barWidth = Math.min(42, (right - left) / 10);
              return <g key={p.day}>
                <rect className={`finance-bar${i === selected ? " is-selected" : ""}`} x={x(i) - barWidth / 2} y={y(p.value)} width={barWidth} height={bottom - y(p.value)} rx="4" />
                {width > 500 && <text className="finance-bar-value" x={x(i)} y={y(p.value) - 10} textAnchor="middle">{money(p.value)}</text>}
              </g>;
            })}
          </g>
        </svg>
      </div>
      <div className="finance-days" role="group" aria-label="Inspect a day" style={{ paddingLeft: left, paddingRight: width - right }}>
        {values.map((p, index) => <button key={p.day} type="button" aria-pressed={selected === index} aria-label={`${p.day}, ${money(p.value)}`} onClick={() => choose(index)}>{p.day.slice(0, 3)}</button>)}
      </div>
      <div className="finance-insight" aria-live="polite" aria-atomic="true">
        <div><span className="visual-label">{current.day}{cumulative ? " · week to date" : ""}</span><strong>{money(current.value)}</strong></div>
        <p>{cumulative ? `Monday to ${current.day.toLowerCase()}.` : `${Math.round(current.amount / sum * 100)}% of the week's spending.`}<span>{cumulative ? "Daily amounts added together." : selected === 5 ? "Largest spend in this sample." : "An example, not a prediction."}</span></p>
      </div>
      <details className="visual-data"><summary>View sample data</summary><table><caption>Illustrative weekly spending in INR</caption><thead><tr><th scope="col">Day</th><th scope="col">Amount spent</th></tr></thead><tbody>{sample.map((p) => <tr key={p.day}><th scope="row">{p.day}</th><td>{money(p.amount)}</td></tr>)}</tbody></table></details>
    </div>
  );
}
