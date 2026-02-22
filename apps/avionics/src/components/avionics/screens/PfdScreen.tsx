import { useFlightData } from "../FlightDataContext";

// Clamp utility
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/* ─── Attitude Indicator ─── */
const AttitudeIndicator = ({ pitch, roll }: { pitch: number; roll: number }) => {
  const pitchPx = clamp(pitch, -30, 30) * 3; // 3px per degree

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <clipPath id="ai-clip"><circle cx="100" cy="100" r="90" /></clipPath>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(210 80% 45%)" />
          <stop offset="100%" stopColor="hsl(205 70% 55%)" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(30 60% 35%)" />
          <stop offset="100%" stopColor="hsl(25 50% 25%)" />
        </linearGradient>
      </defs>

      {/* Background ring */}
      <circle cx="100" cy="100" r="92" fill="none" stroke="hsl(220 15% 25%)" strokeWidth="3" />

      <g clipPath="url(#ai-clip)">
        <g transform={`rotate(${-roll}, 100, 100)`}>
          <g transform={`translate(0, ${pitchPx})`}>
            {/* Sky */}
            <rect x="-50" y="-100" width="300" height="200" fill="url(#sky)" />
            {/* Ground */}
            <rect x="-50" y="100" width="300" height="200" fill="url(#ground)" />
            {/* Horizon line */}
            <line x1="-50" y1="100" x2="250" y2="100" stroke="hsl(0 0% 92%)" strokeWidth="1.5" />

            {/* Pitch lines */}
            {[-20, -10, 10, 20].map((deg) => (
              <g key={deg} transform={`translate(0, ${-deg * 3})`}>
                <line x1="70" y1="100" x2="130" y2="100" stroke="hsl(0 0% 92%)" strokeWidth="1" opacity="0.7" />
                <text x="62" y="103" fill="hsl(0 0% 92%)" fontSize="7" textAnchor="end" opacity="0.7">{Math.abs(deg)}</text>
              </g>
            ))}
            {[-15, -5, 5, 15].map((deg) => (
              <line key={deg} x1="85" y1={100 - deg * 3} x2="115" y2={100 - deg * 3} stroke="hsl(0 0% 92%)" strokeWidth="0.7" opacity="0.5" />
            ))}
          </g>
        </g>
      </g>

      {/* Fixed aircraft symbol */}
      <line x1="40" y1="100" x2="80" y2="100" stroke="hsl(40 100% 55%)" strokeWidth="3" strokeLinecap="round" />
      <line x1="120" y1="100" x2="160" y2="100" stroke="hsl(40 100% 55%)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="100" r="4" fill="none" stroke="hsl(40 100% 55%)" strokeWidth="2.5" />

      {/* Roll pointer (top triangle) */}
      <g transform={`rotate(${-roll}, 100, 100)`}>
        <polygon points="100,12 95,22 105,22" fill="hsl(0 0% 92%)" />
      </g>

      {/* Fixed roll reference triangle */}
      <polygon points="100,12 96,5 104,5" fill="hsl(40 100% 55%)" />

      {/* Bank angle marks */}
      {[30, 60, -30, -60].map((a) => (
        <line
          key={a}
          x1={100 + 88 * Math.sin((a * Math.PI) / 180)}
          y1={100 - 88 * Math.cos((a * Math.PI) / 180)}
          x2={100 + 82 * Math.sin((a * Math.PI) / 180)}
          y2={100 - 82 * Math.cos((a * Math.PI) / 180)}
          stroke="hsl(0 0% 92%)" strokeWidth="1.5" opacity="0.6"
        />
      ))}

      {/* Slip/skid indicator placeholder */}
      <rect x="93" y="24" width="14" height="5" rx="1" fill="none" stroke="hsl(0 0% 92%)" strokeWidth="1" opacity="0.5" />
    </svg>
  );
};

/* ─── Airspeed Tape ─── */
const AirspeedTape = ({ speed }: { speed: number }) => {
  const tapeRange = 40; // knots visible above/below
  const pxPerKt = 3;

  const ticks: { kt: number; y: number }[] = [];
  const start = Math.floor((speed - tapeRange) / 10) * 10;
  const end = Math.ceil((speed + tapeRange) / 10) * 10;
  for (let kt = start; kt <= end; kt += 10) {
    ticks.push({ kt, y: 100 - (kt - speed) * pxPerKt });
  }

  return (
    <svg viewBox="0 0 52 200" className="w-full h-full">
      <defs>
        <clipPath id="spd-clip"><rect x="0" y="10" width="52" height="180" /></clipPath>
        <linearGradient id="spd-bg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(220 20% 6%)" />
          <stop offset="100%" stopColor="hsl(220 18% 10%)" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="52" height="200" fill="url(#spd-bg)" stroke="hsl(220 15% 25%)" strokeWidth="1" />

      <g clipPath="url(#spd-clip)">
        {ticks.map(({ kt, y }) => (
          <g key={kt}>
            <line x1="42" y1={y} x2="52" y2={y} stroke="hsl(0 0% 92%)" strokeWidth="1" opacity="0.5" />
            {kt >= 0 && (
              <text x="38" y={y + 3} fill="hsl(0 0% 92%)" fontSize="9" fontFamily="'Share Tech Mono', monospace" textAnchor="end">
                {kt}
              </text>
            )}
          </g>
        ))}
        {/* 5-knot minor ticks */}
        {Array.from({ length: Math.ceil(tapeRange * 2 / 5) + 1 }, (_, i) => {
          const kt = Math.floor((speed - tapeRange) / 5) * 5 + i * 5;
          if (kt % 10 === 0) return null;
          const y = 100 - (kt - speed) * pxPerKt;
          return <line key={kt} x1="46" y1={y} x2="52" y2={y} stroke="hsl(0 0% 92%)" strokeWidth="0.5" opacity="0.3" />;
        })}
      </g>

      {/* Current speed box */}
      <rect x="2" y="88" width="42" height="24" rx="2" fill="hsl(220 20% 8%)" stroke="hsl(160 100% 45%)" strokeWidth="1.5" />
      <text x="22" y="104" fill="hsl(160 100% 45%)" fontSize="13" fontFamily="'Share Tech Mono', monospace" textAnchor="middle" fontWeight="bold">
        {Math.round(speed)}
      </text>

      {/* Label */}
      <text x="26" y="198" fill="hsl(220 10% 50%)" fontSize="7" fontFamily="'Share Tech Mono', monospace" textAnchor="middle">KTS</text>
    </svg>
  );
};

/* ─── Altimeter Tape ─── */
const AltimeterTape = ({ altitude, vs }: { altitude: number; vs: number }) => {
  const tapeRange = 400;
  const pxPerFt = 0.3;

  const ticks: { ft: number; y: number }[] = [];
  const start = Math.floor((altitude - tapeRange) / 100) * 100;
  const end = Math.ceil((altitude + tapeRange) / 100) * 100;
  for (let ft = start; ft <= end; ft += 100) {
    ticks.push({ ft, y: 100 - (ft - altitude) * pxPerFt });
  }

  // VS arrow
  const vsArrowLen = clamp(vs / 20, -60, 60);

  return (
    <svg viewBox="0 0 60 200" className="w-full h-full">
      <defs>
        <clipPath id="alt-clip"><rect x="0" y="10" width="60" height="180" /></clipPath>
        <linearGradient id="alt-bg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(220 18% 10%)" />
          <stop offset="100%" stopColor="hsl(220 20% 6%)" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="60" height="200" fill="url(#alt-bg)" stroke="hsl(220 15% 25%)" strokeWidth="1" />

      <g clipPath="url(#alt-clip)">
        {ticks.map(({ ft, y }) => (
          <g key={ft}>
            <line x1="0" y1={y} x2="8" y2={y} stroke="hsl(0 0% 92%)" strokeWidth="1" opacity="0.5" />
            <text x="12" y={y + 3} fill="hsl(0 0% 92%)" fontSize="8" fontFamily="'Share Tech Mono', monospace">
              {ft.toLocaleString()}
            </text>
          </g>
        ))}
      </g>

      {/* Current altitude box */}
      <rect x="4" y="88" width="46" height="24" rx="2" fill="hsl(220 20% 8%)" stroke="hsl(160 100% 45%)" strokeWidth="1.5" />
      <text x="27" y="104" fill="hsl(160 100% 45%)" fontSize="12" fontFamily="'Share Tech Mono', monospace" textAnchor="middle" fontWeight="bold">
        {Math.round(altitude).toLocaleString()}
      </text>

      {/* VS arrow on right edge */}
      {Math.abs(vs) > 50 && (
        <g>
          <line x1="55" y1="100" x2="55" y2={100 - vsArrowLen} stroke="hsl(185 100% 55%)" strokeWidth="2" />
          <polygon
            points={vsArrowLen > 0
              ? "52," + (100 - vsArrowLen) + " 58," + (100 - vsArrowLen) + " 55," + (100 - vsArrowLen - 5)
              : "52," + (100 - vsArrowLen) + " 58," + (100 - vsArrowLen) + " 55," + (100 - vsArrowLen + 5)
            }
            fill="hsl(185 100% 55%)"
          />
        </g>
      )}

      {/* VS readout */}
      <text x="55" y="8" fill="hsl(185 100% 55%)" fontSize="7" fontFamily="'Share Tech Mono', monospace" textAnchor="middle">
        {vs > 0 ? "+" : ""}{Math.round(vs / 10) * 10}
      </text>

      {/* Label */}
      <text x="27" y="198" fill="hsl(220 10% 50%)" fontSize="7" fontFamily="'Share Tech Mono', monospace" textAnchor="middle">FT</text>
    </svg>
  );
};

/* ─── Heading Indicator ─── */
const HeadingIndicator = ({ heading, dtk }: { heading: number; dtk: number }) => {
  const pxPerDeg = 2.2;
  const range = 50;

  const ticks: { deg: number; x: number }[] = [];
  for (let d = -range; d <= range; d += 5) {
    let deg = ((heading + d) % 360 + 360) % 360;
    ticks.push({ deg, x: 100 + d * pxPerDeg });
  }

  const cardinals: Record<number, string> = { 0: "N", 90: "E", 180: "S", 270: "W" };

  // DTK bug position
  let dtkDiff = ((dtk - heading) % 360 + 540) % 360 - 180;
  const dtkX = 100 + dtkDiff * pxPerDeg;
  const dtkVisible = Math.abs(dtkDiff) < range;

  return (
    <svg viewBox="0 0 200 36" className="w-full h-full">
      <defs>
        <clipPath id="hdg-clip"><rect x="10" y="0" width="180" height="36" /></clipPath>
      </defs>

      <rect x="0" y="0" width="200" height="36" fill="hsl(220 20% 6%)" stroke="hsl(220 15% 25%)" strokeWidth="1" />

      <g clipPath="url(#hdg-clip)">
        {ticks.map(({ deg, x }, i) => {
          const isMajor = deg % 10 === 0;
          const label = cardinals[deg] || (deg % 30 === 0 ? String(deg / 10).padStart(2, "0") : null);
          return (
            <g key={i}>
              <line x1={x} y1={isMajor ? 24 : 28} x2={x} y2={36} stroke="hsl(0 0% 92%)" strokeWidth={isMajor ? 1 : 0.5} opacity={isMajor ? 0.8 : 0.3} />
              {label && (
                <text x={x} y={20} fill={cardinals[deg] ? "hsl(40 100% 55%)" : "hsl(0 0% 92%)"} fontSize={cardinals[deg] ? "11" : "9"} fontFamily="'Share Tech Mono', monospace" textAnchor="middle" fontWeight={cardinals[deg] ? "bold" : "normal"}>
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* DTK bug */}
        {dtkVisible && (
          <polygon points={`${dtkX - 4},36 ${dtkX + 4},36 ${dtkX},30`} fill="hsl(300 80% 60%)" opacity="0.8" />
        )}
      </g>

      {/* Center pointer */}
      <polygon points="100,36 96,30 104,30" fill="hsl(160 100% 45%)" />

      {/* Heading readout */}
      <rect x="80" y="0" width="40" height="16" rx="2" fill="hsl(220 20% 8%)" stroke="hsl(160 100% 45%)" strokeWidth="1" />
      <text x="100" y="12" fill="hsl(160 100% 45%)" fontSize="10" fontFamily="'Share Tech Mono', monospace" textAnchor="middle" fontWeight="bold">
        {String(Math.round(heading) % 360).padStart(3, "0")}°
      </text>
    </svg>
  );
};

/* ─── PFD Screen ─── */
export const PfdScreen = () => {
  const { flight, fuel, navigation, connectionMode } = useFlightData();

  // Simulate pitch from vertical speed (simplified for display)
  const pitch = clamp(flight.verticalSpeed / 100, -25, 25);
  // No roll data from context — use a slight simulated bank
  const roll = 0;

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-avionics-divider bg-avionics-panel">
        <span className="font-mono text-[10px] text-avionics-cyan tracking-wider">PFD</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] text-avionics-label">
            GS <span className="text-avionics-white">{flight.groundSpeed}</span> KT
          </span>
          <span className="font-mono text-[9px] text-avionics-label">
            MACH <span className="text-avionics-white">{flight.mach.toFixed(2)}</span>
          </span>
          <span className={`font-mono text-[9px] ${connectionMode === "none" ? "text-avionics-label" : "text-avionics-green"}`}>
            {connectionMode === "none" ? "NO DATA" : connectionMode.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main PFD layout */}
      <div className="flex-1 flex flex-col p-1.5 gap-1 min-h-0">
        {/* Upper: Airspeed | Attitude | Altimeter */}
        <div className="flex-1 flex gap-1 min-h-0">
          {/* Airspeed tape */}
          <div className="w-[52px] flex-shrink-0">
            <AirspeedTape speed={flight.speed} />
          </div>

          {/* Attitude indicator */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-[200px] aspect-square">
              <AttitudeIndicator pitch={pitch} roll={roll} />
            </div>
          </div>

          {/* Altimeter tape */}
          <div className="w-[60px] flex-shrink-0">
            <AltimeterTape altitude={flight.altitude} vs={flight.verticalSpeed} />
          </div>
        </div>

        {/* Lower: Heading indicator */}
        <div className="h-[36px] flex-shrink-0">
          <HeadingIndicator heading={flight.heading} dtk={navigation.dtk} />
        </div>

        {/* Data strip */}
        <div className="flex items-center justify-between px-2 py-1 bg-avionics-panel rounded border border-avionics-divider">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-avionics-label font-mono">NAV</span>
              <span className="font-mono text-[10px] text-avionics-magenta">{navigation.nextWaypoint}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-avionics-label font-mono">DTK</span>
              <span className="font-mono text-[10px] text-avionics-magenta">{navigation.dtk}°</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-avionics-label font-mono">DIS</span>
              <span className="font-mono text-[10px] text-avionics-white">{navigation.distanceToNext}</span>
              <span className="text-[7px] text-avionics-label">NM</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-avionics-label font-mono">VS</span>
              <span className={`font-mono text-[10px] ${flight.verticalSpeed > 50 ? "text-avionics-green" : flight.verticalSpeed < -50 ? "text-avionics-amber" : "text-avionics-white"}`}>
                {flight.verticalSpeed > 0 ? "+" : ""}{Math.round(flight.verticalSpeed / 10) * 10}
              </span>
              <span className="text-[7px] text-avionics-label">FPM</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-avionics-label font-mono">ETA</span>
              <span className="font-mono text-[10px] text-avionics-cyan">{navigation.eta}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end px-3 py-1 border-t border-avionics-divider">
        <span className="font-mono text-[10px] text-avionics-cyan">PFD</span>
      </div>
    </div>
  );
};
