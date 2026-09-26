import { useEffect, useRef, useState } from "react";
import { travelStops } from "@/lib/travel-map-data";

const steps = [
  { title: "A day, planned.", label: "Plan", detail: "One day. Three stops.", sub: "Trip intelligence", icon: "01" },
  { title: "Find the words.", label: "Translate", detail: "Hindi ↔ English", sub: "Voice translation concept", icon: "02" },
  { title: "See where to go.", label: "Navigate", detail: "Next stop: Lodhi Gardens", sub: "Places, in context", icon: "03" },
];

export function RoamExperience() {
  const host = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [stop, setStop] = useState(0);
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const element = host.current;
    const update = (event: Event) => { const next = (event as CustomEvent<number>).detail; setStep(next); setStop(next); };
    element?.addEventListener("roam-step", update);
    return () => element?.removeEventListener("roam-step", update);
  }, []);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div className="travel-story" data-travel-story ref={host} data-step={step} data-stop={stop}>
      <div className="travel-pin" data-travel-pin>
        <header className="travel-editorial">
          <p className="visual-label">03 / ROAM OS</p>
          <h2 id="roam-title">{steps[step].title}</h2>
          <p className="travel-intent">A trip plan, a phrase, your next stop.</p>
          <div className="travel-controls" role="group" aria-label="Explore ROAM concept">
            {steps.map((item, i) => <button type="button" key={item.label} aria-pressed={step === i} onClick={() => { setStep(i); setStop(i); }}><span>{item.icon}</span>{item.label}<i aria-hidden="true" /></button>)}
          </div>
          <span className="travel-status">Interactive concept · in development</span>
        </header>
        <div className="travel-visual" aria-label="Illustrative travel interface">
          <div className="travel-coordinate"><span>NEW DELHI / TRIP CONCEPT</span><span>ROAM OS</span></div>
          <div className="travel-request"><span>EXAMPLE REQUEST</span><p>“Plan one day in Delhi.”</p></div>
          <div className="travel-camera" data-travel-camera>
            <svg className="travel-map" viewBox="0 0 680 600" role="img" aria-labelledby="travel-map-title travel-map-desc">
              <title id="travel-map-title">Three places in central New Delhi</title>
              <desc id="travel-map-desc">India Gate, National Museum and Lodhi Gardens plotted from OpenStreetMap coordinates. Dashed lines show a suggested stop order, not road directions. Select a place using the buttons below.</desc>
              <image href="/assets/maps/delhi.svg" width="680" height="600" />
              <path d={`M${travelStops.map((p) => `${p.x},${p.y}`).join(" L")}`} className="travel-stop-order" pathLength="1" />
              {travelStops.map((place, index) => <g key={place.name} transform={`translate(${place.x},${place.y})`}>
                <circle r={stop === index ? 22 : 17} fill={stop === index ? "#d76441" : "#315bdd"} stroke="white" strokeWidth="4" />
                <text y="4" textAnchor="middle" className="travel-node-number">{index + 1}</text>
                <rect x="-78" y={index === 0 ? -63 : 28} width="156" height="30" rx="6" fill="white" stroke="#c9d6ef" />
                <text y={index === 0 ? -43 : 48} textAnchor="middle" className="travel-node-label">{place.name}</text>
              </g>)}
              <g transform="translate(620,70)" fill="#315477"><path d="M0 -24 L-5 -9 L5 -9 Z" /><text x="0" y="8" textAnchor="middle" fontSize="13">N</text></g>
            </svg>
          </div>
          <div className="travel-product" key={step} style={isPhone && stop === 2 ? { width: "170px" } : undefined}>
            <span className="visual-label">{steps[step].sub}</span>
            <h3>{steps[step].detail}</h3>
            {step === 0 && <ol className="travel-itinerary">{travelStops.map((place, index) => <li key={place.name}><button type="button" aria-pressed={stop === index} onClick={() => setStop(index)}><b>0{index + 1}</b><span>{place.name}</span></button></li>)}</ol>}
            {step === 1 && <div className="travel-translation"><div className="travel-wave" aria-hidden="true">{[9, 20, 32, 16, 42, 26, 14, 35, 48, 22, 32, 12, 24, 8].map((height, i) => <i key={i} style={{ height }} />)}</div><p lang="hi">संग्रहालय कहाँ है?</p><p>Where is the museum?</p><span>Example phrase · no microphone used</span></div>}
            {step === 2 && <div className="travel-navigation"><svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 56V16M18 30l14-14 14 14" stroke="currentColor" strokeWidth="3" /></svg><p>National Museum → Lodhi Gardens</p><span>Places are real. This itinerary is an example.</span></div>}
          </div>
          <div className="travel-map-note"><span className="travel-map-key"><i aria-hidden="true" />Stop order · not road directions</span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a></div>
        </div>
      </div>
    </div>
  );
}
