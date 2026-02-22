import { useState } from "react";
import { useFlightData } from "../FlightDataContext";
import { Thermometer, Wind } from "lucide-react";

const WindRose = ({ windDir, windSpd, heading, headwind, crosswind }: {
  windDir: number; windSpd: number; heading: number; headwind: number; crosswind: number;
}) => {
  const cx = 90;
  const cy = 90;
  const r = 70;
  const innerR = 20;

  // Wind arrow from direction wind is coming FROM
  const windRad = (windDir - 90) * (Math.PI / 180);
  const windFromX = cx + r * Math.cos(windRad);
  const windFromY = cy + r * Math.sin(windRad);
  const windToX = cx - r * 0.3 * Math.cos(windRad);
  const windToY = cy - r * 0.3 * Math.sin(windRad);

  // Heading line
  const hdgRad = (heading - 90) * (Math.PI / 180);
  const hdgX = cx + r * Math.cos(hdgRad);
  const hdgY = cy + r * Math.sin(hdgRad);
  const hdgTailX = cx - r * 0.6 * Math.cos(hdgRad);
  const hdgTailY = cy - r * 0.6 * Math.sin(hdgRad);

  // Headwind/crosswind component lines from center along heading axis
  const hwLen = Math.min(Math.abs(headwind) * 2, r * 0.8);
  const cwLen = Math.min(Math.abs(crosswind) * 2, r * 0.8);

  // Headwind component along heading direction
  const hwSign = headwind >= 0 ? -1 : 1; // headwind opposes heading
  const hwX = cx + hwSign * hwLen * Math.cos(hdgRad);
  const hwY = cy + hwSign * hwLen * Math.sin(hdgRad);

  // Crosswind perpendicular to heading
  const cwRad = hdgRad + Math.PI / 2;
  const cwSign = crosswind >= 0 ? 1 : -1;
  const cwX = cx + cwSign * cwLen * Math.cos(cwRad);
  const cwY = cy + cwSign * cwLen * Math.sin(cwRad);

  // Cardinal directions at compass positions
  const cardinals = [
    { label: "N", angle: -90 },
    { label: "E", angle: 0 },
    { label: "S", angle: 90 },
    { label: "W", angle: 180 },
  ];

  return (
    <svg viewBox="0 0 180 180" className="w-full h-full" style={{ maxHeight: 180 }}>
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(220 15% 22%)" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={r * 0.66} fill="none" stroke="hsl(220 15% 18%)" strokeWidth={0.5} strokeDasharray="3 3" />
      <circle cx={cx} cy={cy} r={r * 0.33} fill="none" stroke="hsl(220 15% 18%)" strokeWidth={0.5} strokeDasharray="3 3" />
      <circle cx={cx} cy={cy} r={innerR} fill="hsl(220 20% 10%)" stroke="hsl(220 15% 25%)" strokeWidth={0.8} />

      {/* Tick marks every 30° */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 - 90) * (Math.PI / 180);
        const x1 = cx + (r - 4) * Math.cos(a);
        const y1 = cy + (r - 4) * Math.sin(a);
        const x2 = cx + r * Math.cos(a);
        const y2 = cy + r * Math.sin(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(220 10% 35%)" strokeWidth={1} />;
      })}

      {/* Cardinal labels */}
      {cardinals.map((c) => {
        const a = c.angle * (Math.PI / 180);
        const lx = cx + (r + 10) * Math.cos(a);
        const ly = cy + (r + 10) * Math.sin(a);
        return (
          <text key={c.label} x={lx} y={ly} fill="hsl(220 10% 50%)" fontSize="8" fontFamily="Share Tech Mono" textAnchor="middle" dominantBaseline="central">
            {c.label}
          </text>
        );
      })}

      {/* Heading line (cyan dashed) */}
      <line x1={hdgTailX} y1={hdgTailY} x2={hdgX} y2={hdgY} stroke="hsl(185 100% 55%)" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
      {/* Heading arrowhead */}
      <circle cx={hdgX} cy={hdgY} r={3} fill="hsl(185 100% 55%)" opacity={0.8} />
      <text
        x={cx + (r + 10) * Math.cos(hdgRad)} y={cy + (r + 10) * Math.sin(hdgRad)}
        fill="hsl(185 100% 55%)" fontSize="7" fontFamily="Share Tech Mono" textAnchor="middle" dominantBaseline="central"
      >
        HDG
      </text>

      {/* Wind arrow (magenta, from windDir toward center) */}
      <line x1={windFromX} y1={windFromY} x2={windToX} y2={windToY} stroke="hsl(300 80% 60%)" strokeWidth={2} />
      {/* Wind arrowhead */}
      {(() => {
        const arrLen = 6;
        const arrAngle = 0.4;
        const dx = windToX - windFromX;
        const dy = windToY - windFromY;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len;
        const uy = dy / len;
        const ax1 = windToX - arrLen * (ux * Math.cos(arrAngle) - uy * Math.sin(arrAngle));
        const ay1 = windToY - arrLen * (uy * Math.cos(arrAngle) + ux * Math.sin(arrAngle));
        const ax2 = windToX - arrLen * (ux * Math.cos(arrAngle) + uy * Math.sin(arrAngle));
        const ay2 = windToY - arrLen * (uy * Math.cos(arrAngle) - ux * Math.sin(arrAngle));
        return <polygon points={`${windToX},${windToY} ${ax1},${ay1} ${ax2},${ay2}`} fill="hsl(300 80% 60%)" />;
      })()}

      {/* Headwind component bar */}
      {Math.abs(headwind) > 0 && (
        <line x1={cx} y1={cy} x2={hwX} y2={hwY}
          stroke={headwind >= 0 ? "hsl(40 100% 55%)" : "hsl(160 100% 45%)"}
          strokeWidth={3} strokeLinecap="round" opacity={0.7}
        />
      )}

      {/* Crosswind component bar */}
      {Math.abs(crosswind) > 0 && (
        <line x1={cx} y1={cy} x2={cwX} y2={cwY}
          stroke="hsl(0 0% 80%)" strokeWidth={3} strokeLinecap="round" opacity={0.5}
        />
      )}

      {/* Center aircraft symbol */}
      <g transform={`translate(${cx},${cy}) rotate(${heading})`}>
        <polygon points="0,-8 -3,4 0,1 3,4" fill="hsl(0 0% 92%)" stroke="hsl(0 0% 70%)" strokeWidth={0.5} />
      </g>

      {/* Wind speed label near wind arrow origin */}
      <text
        x={cx + (r - 15) * Math.cos(windRad)} y={cy + (r - 15) * Math.sin(windRad)}
        fill="hsl(300 80% 60%)" fontSize="8" fontFamily="Share Tech Mono" textAnchor="middle" dominantBaseline="central" fontWeight="bold"
      >
        {windSpd}kt
      </text>

      {/* Wind direction label */}
      <text
        x={cx + (r + 10) * Math.cos(windRad)} y={cy + (r + 10) * Math.sin(windRad)}
        fill="hsl(300 80% 60%)" fontSize="7" fontFamily="Share Tech Mono" textAnchor="middle" dominantBaseline="central"
      >
        {windDir}°
      </text>
    </svg>
  );
};

export const DaltScreen = () => {
  const { flight, weather } = useFlightData();

  const [useSensor, setUseSensor] = useState(true);
  const [manualAlt, setManualAlt] = useState(5000);
  const [manualBaro, setManualBaro] = useState(29.92);
  const [manualCas, setManualCas] = useState(120);
  const [manualTat, setManualTat] = useState(15);
  const [manualHdg, setManualHdg] = useState(360);
  const [manualTrk, setManualTrk] = useState(360);
  const [manualGS, setManualGS] = useState(120);

  // Use sensor data or manual
  const alt = useSensor ? flight.altitude : manualAlt;
  const baro = useSensor ? weather.pressure / 33.8639 : manualBaro; // hPa to inHg
  const cas = useSensor ? flight.speed : manualCas;
  const tat = useSensor ? weather.temperature : manualTat;
  const hdg = useSensor ? flight.heading : manualHdg;
  const trk = useSensor ? (flight.groundSpeed > 0 ? flight.heading : 0) : manualTrk; // simplified
  const gs = useSensor ? flight.groundSpeed : manualGS;

  // Pressure altitude = indicated alt + (29.92 - baro) × 1000
  const pressureAlt = alt + (29.92 - baro) * 1000;

  // ISA temp at pressure altitude: 15 - (pressureAlt / 1000) × 1.98
  const isaTemp = 15 - (pressureAlt / 1000) * 1.98;
  const isaDev = tat - isaTemp;

  // Density altitude = pressure alt + (120 × ISA deviation)
  const densityAlt = Math.round(pressureAlt + 120 * isaDev);

  // TAS = CAS × √(ρ₀/ρ) ≈ CAS × (1 + pressureAlt/50000) simplified
  const tasCorrection = 1 + pressureAlt / 50000;
  const tas = Math.round(cas * tasCorrection);

  // Wind calculation (simplified from hdg/trk/gs/tas)
  const windDir = weather.windDir || 0;
  const windSpd = weather.windSpeed || 0;

  // Wind components relative to heading
  const windAngle = ((windDir - hdg + 360) % 360) * (Math.PI / 180);
  const headwind = Math.round(windSpd * Math.cos(windAngle));
  const crosswind = Math.round(windSpd * Math.sin(windAngle));

  const InputRow = ({ label, value, unit, onInc, onDec }: { label: string; value: string | number; unit: string; onInc: () => void; onDec: () => void }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-avionics-divider/50">
      <span className="text-[9px] text-avionics-label font-mono uppercase">{label}</span>
      <div className="flex items-center gap-1">
        {!useSensor && (
          <button onClick={onDec} className="w-5 h-5 rounded bg-avionics-button text-avionics-white text-xs hover:bg-avionics-button-hover">−</button>
        )}
        <span className="font-mono text-xs text-avionics-cyan w-16 text-center">{value}</span>
        {!useSensor && (
          <button onClick={onInc} className="w-5 h-5 rounded bg-avionics-button text-avionics-white text-xs hover:bg-avionics-button-hover">+</button>
        )}
        <span className="text-[8px] text-avionics-label ml-1">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-avionics-divider bg-avionics-panel">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-avionics-cyan" />
          <span className="font-mono text-[10px] text-avionics-cyan tracking-wider">DALT / TAS / WINDS</span>
        </div>
        <button
          onClick={() => setUseSensor(!useSensor)}
          className={`font-mono text-[9px] px-2 py-0.5 rounded border ${
            useSensor ? "border-avionics-green text-avionics-green" : "border-avionics-divider text-avionics-label"
          }`}
        >
          {useSensor ? "SENSOR" : "MANUAL"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* Inputs */}
        <div className="bg-avionics-panel rounded-lg border border-avionics-divider p-3">
          <span className="text-[9px] text-avionics-label font-mono block mb-2">INPUTS</span>
          <InputRow label="Indicated ALT" value={Math.round(alt).toLocaleString()} unit="FT" onInc={() => setManualAlt(a => a + 500)} onDec={() => setManualAlt(a => Math.max(a - 500, 0))} />
          <InputRow label="BARO" value={baro.toFixed(2)} unit="inHg" onInc={() => setManualBaro(b => Math.min(b + 0.01, 31))} onDec={() => setManualBaro(b => Math.max(b - 0.01, 28))} />
          <InputRow label="CAS" value={Math.round(cas)} unit="KT" onInc={() => setManualCas(c => c + 5)} onDec={() => setManualCas(c => Math.max(c - 5, 0))} />
          <InputRow label="TAT" value={`${Math.round(tat)}°`} unit="C" onInc={() => setManualTat(t => t + 1)} onDec={() => setManualTat(t => t - 1)} />
          <InputRow label="HDG" value={`${Math.round(hdg)}°`} unit="" onInc={() => setManualHdg(h => (h + 10) % 360)} onDec={() => setManualHdg(h => (h - 10 + 360) % 360)} />
          <InputRow label="GS" value={Math.round(gs)} unit="KT" onInc={() => setManualGS(g => g + 5)} onDec={() => setManualGS(g => Math.max(g - 5, 0))} />
        </div>

        {/* Outputs */}
        <div className="bg-avionics-panel rounded-lg border border-avionics-divider p-3">
          <span className="text-[9px] text-avionics-label font-mono block mb-2">RESULTS</span>
          <div className="flex items-center justify-between py-2 border-b border-avionics-divider/50">
            <span className="text-[9px] text-avionics-label font-mono">PRESSURE ALT</span>
            <span className="font-mono text-sm text-avionics-white">{Math.round(pressureAlt).toLocaleString()} <span className="text-[8px] text-avionics-label">FT</span></span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-avionics-divider/50">
            <span className="text-[9px] text-avionics-label font-mono">DENSITY ALT</span>
            <span className={`font-mono text-sm ${densityAlt > alt + 2000 ? "text-avionics-amber" : "text-avionics-green"}`}>
              {densityAlt.toLocaleString()} <span className="text-[8px] text-avionics-label">FT</span>
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-avionics-divider/50">
            <span className="text-[9px] text-avionics-label font-mono">ISA DEV</span>
            <span className={`font-mono text-sm ${isaDev > 0 ? "text-avionics-amber" : "text-avionics-cyan"}`}>
              {isaDev > 0 ? "+" : ""}{isaDev.toFixed(1)}°C
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-avionics-divider/50">
            <span className="text-[9px] text-avionics-label font-mono">TAS</span>
            <span className="font-mono text-sm text-avionics-cyan">{tas} <span className="text-[8px] text-avionics-label">KT</span></span>
          </div>
        </div>

        {/* Wind Rose Diagram */}
        <div className="bg-avionics-panel rounded-lg border border-avionics-divider p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Wind className="w-3 h-3 text-avionics-green" />
            <span className="text-[9px] text-avionics-label font-mono">WIND COMPONENTS</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Wind rose SVG */}
            <div className="w-[180px] h-[180px] shrink-0">
              <WindRose windDir={windDir} windSpd={windSpd} heading={hdg} headwind={headwind} crosswind={crosswind} />
            </div>
            {/* Numeric readouts */}
            <div className="flex-1 space-y-2">
              <div className="bg-avionics-panel-dark rounded p-2 border border-avionics-divider/50">
                <span className="text-[7px] text-avionics-label font-mono block">WIND</span>
                <span className="font-mono text-sm text-avionics-magenta">{windDir}° / {windSpd} KT</span>
              </div>
              <div className="bg-avionics-panel-dark rounded p-2 border border-avionics-divider/50">
                <span className="text-[7px] text-avionics-label font-mono block">{headwind >= 0 ? "HEADWIND" : "TAILWIND"}</span>
                <span className={`font-mono text-sm ${headwind >= 0 ? "text-avionics-amber" : "text-avionics-green"}`}>
                  {Math.abs(headwind)} KT
                </span>
              </div>
              <div className="bg-avionics-panel-dark rounded p-2 border border-avionics-divider/50">
                <span className="text-[7px] text-avionics-label font-mono block">CROSSWIND</span>
                <span className="font-mono text-sm text-avionics-white">
                  {Math.abs(crosswind)} KT {crosswind > 0 ? "R" : crosswind < 0 ? "L" : ""}
                </span>
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-avionics-divider/30">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-avionics-magenta rounded" />
              <span className="text-[7px] text-avionics-label font-mono">WIND</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 rounded" style={{ background: "hsl(185 100% 55%)" }} />
              <span className="text-[7px] text-avionics-label font-mono">HDG</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-avionics-amber rounded" style={{ opacity: 0.7 }} />
              <span className="text-[7px] text-avionics-label font-mono">H/W</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 rounded" style={{ background: "hsl(0 0% 80%)", opacity: 0.5 }} />
              <span className="text-[7px] text-avionics-label font-mono">X/W</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end px-3 py-1 border-t border-avionics-divider">
        <span className="font-mono text-[10px] text-avionics-cyan">DALT</span>
      </div>
    </div>
  );
};
