import { useState, useEffect, useCallback, useRef, useMemo } from "react";

type TimerId = "flight" | "elapsed" | "countdown";

/* ─── Fuel Planner ─── */
const FuelPlanner = () => {
  const [fuelOnboard, setFuelOnboard] = useState(48); // gallons
  const [burnRate, setBurnRate] = useState(10.5); // gph
  const [groundSpeed, setGroundSpeed] = useState(125); // kts
  const [reserve, setReserve] = useState(6); // gallons reserve

  const stats = useMemo(() => {
    const usable = Math.max(0, fuelOnboard - reserve);
    const enduranceHrs = burnRate > 0 ? usable / burnRate : 0;
    const enduranceMin = enduranceHrs * 60;
    const rangeNm = groundSpeed * enduranceHrs;
    const totalEnduranceHrs = burnRate > 0 ? fuelOnboard / burnRate : 0;
    const reserveTime = burnRate > 0 ? reserve / burnRate : 0;
    const fuelPercent = fuelOnboard > 0 ? Math.min(1, usable / fuelOnboard) : 0;
    return { usable, enduranceHrs, enduranceMin, rangeNm, totalEnduranceHrs, reserveTime, fuelPercent };
  }, [fuelOnboard, burnRate, groundSpeed, reserve]);

  const formatEndurance = (hrs: number) => {
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  const isLow = stats.enduranceMin < 45;
  const isCritical = stats.enduranceMin < 20;

  const InputRow = ({ label, value, onChange, unit, step = 1, min = 0, max = 999 }: {
    label: string; value: number; onChange: (v: number) => void; unit: string; step?: number; min?: number; max?: number;
  }) => (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-avionics-divider/30">
      <span className="text-[9px] text-avionics-label font-mono w-24">{label}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(min, +(value - step).toFixed(1)))}
          className="w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono bg-avionics-button text-avionics-cyan avionics-bezel hover:bg-avionics-button-hover"
        >−</button>
        <span className="font-mono text-sm text-avionics-green avionics-glow-green w-14 text-center font-bold">
          {value.toFixed(step < 1 ? 1 : 0)}
        </span>
        <button
          onClick={() => onChange(Math.min(max, +(value + step).toFixed(1)))}
          className="w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono bg-avionics-button text-avionics-cyan avionics-bezel hover:bg-avionics-button-hover"
        >+</button>
        <span className="text-[8px] text-avionics-label font-mono w-8">{unit}</span>
      </div>
    </div>
  );

  return (
    <div>
      <InputRow label="FUEL ONBOARD" value={fuelOnboard} onChange={setFuelOnboard} unit="GAL" step={1} max={200} />
      <InputRow label="BURN RATE" value={burnRate} onChange={setBurnRate} unit="GPH" step={0.5} max={50} />
      <InputRow label="GROUND SPD" value={groundSpeed} onChange={setGroundSpeed} unit="KTS" step={5} max={300} />
      <InputRow label="RESERVE" value={reserve} onChange={setReserve} unit="GAL" step={1} max={fuelOnboard} />

      {/* Fuel gauge bar */}
      <div className="px-3 py-2 border-b border-avionics-divider/30">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[8px] text-avionics-label font-mono">FUEL</span>
          <div className="flex-1 h-2 bg-avionics-divider rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isCritical ? "bg-red-500" : isLow ? "bg-avionics-amber" : "bg-avionics-green"
              }`}
              style={{ width: `${stats.fuelPercent * 100}%` }}
            />
          </div>
          <span className="text-[8px] text-avionics-label font-mono w-8 text-right">
            {Math.round(stats.fuelPercent * 100)}%
          </span>
        </div>
        {/* Reserve portion indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-avionics-label font-mono">RSRV</span>
          <div className="flex-1 h-1 bg-avionics-divider rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-avionics-amber/60"
              style={{ width: `${fuelOnboard > 0 ? (reserve / fuelOnboard) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[8px] text-avionics-label font-mono w-8 text-right">{reserve}G</span>
        </div>
      </div>

      {/* Computed results */}
      <div className="grid grid-cols-2 gap-px bg-avionics-divider/30">
        {[
          { label: "ENDURANCE", value: formatEndurance(stats.enduranceHrs), unit: "h:mm", color: isCritical ? "text-red-500" : isLow ? "text-avionics-amber" : "text-avionics-green" },
          { label: "RANGE", value: Math.round(stats.rangeNm).toString(), unit: "NM", color: "text-avionics-cyan" },
          { label: "TOTAL ENDUR", value: formatEndurance(stats.totalEnduranceHrs), unit: "h:mm", color: "text-avionics-white" },
          { label: "RSRV TIME", value: formatEndurance(stats.reserveTime), unit: "h:mm", color: "text-avionics-amber" },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="flex flex-col items-center py-2 bg-avionics-panel-dark">
            <span className="text-[7px] text-avionics-label font-mono">{label}</span>
            <span className={`font-mono text-lg font-bold ${color}`}>{value}</span>
            <span className="text-[7px] text-avionics-label font-mono">{unit}</span>
          </div>
        ))}
      </div>

      {/* Low fuel warning */}
      {isLow && (
        <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 ${isCritical ? "bg-red-500/10" : "bg-avionics-amber/10"}`}>
          <span className={`font-mono text-[10px] font-bold ${isCritical ? "text-red-500 animate-pulse" : "text-avionics-amber"}`}>
            ⚠ {isCritical ? "FUEL CRITICAL" : "LOW FUEL"} — {Math.round(stats.enduranceMin)} MIN REMAINING
          </span>
        </div>
      )}
    </div>
  );
};

const formatTime = (seconds: number) => {
  const neg = seconds < 0;
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  return `${neg ? "-" : ""}${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const CountdownSetter = ({ onSet }: { onSet: (seconds: number) => void }) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(10);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setHours(h => Math.min(h + 1, 23))}
          className="w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono bg-avionics-button text-avionics-cyan avionics-bezel hover:bg-avionics-button-hover"
        >▲</button>
        <span className="font-mono text-sm text-avionics-white w-6 text-center">{hours.toString().padStart(2, "0")}</span>
        <button
          onClick={() => setHours(h => Math.max(h - 1, 0))}
          className="w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono bg-avionics-button text-avionics-cyan avionics-bezel hover:bg-avionics-button-hover"
        >▼</button>
      </div>
      <span className="text-avionics-white font-mono text-sm">:</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setMinutes(m => Math.min(m + 1, 59))}
          className="w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono bg-avionics-button text-avionics-cyan avionics-bezel hover:bg-avionics-button-hover"
        >▲</button>
        <span className="font-mono text-sm text-avionics-white w-6 text-center">{minutes.toString().padStart(2, "0")}</span>
        <button
          onClick={() => setMinutes(m => Math.max(m - 1, 0))}
          className="w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono bg-avionics-button text-avionics-cyan avionics-bezel hover:bg-avionics-button-hover"
        >▼</button>
      </div>
      <button
        onClick={() => onSet(hours * 3600 + minutes * 60)}
        className="px-2 py-1 rounded text-[9px] font-mono bg-avionics-green/20 text-avionics-green avionics-bezel hover:bg-avionics-green/30 transition-colors ml-1"
      >
        Set
      </button>
    </div>
  );
};

export const UtilitiesScreen = () => {
  const [flightTime, setFlightTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [countdownTime, setCountdownTime] = useState(600); // 10 min default
  const [countdownInitial, setCountdownInitial] = useState(600);
  const [running, setRunning] = useState<Record<TimerId, boolean>>({ flight: false, elapsed: false, countdown: false });
  const [showCountdownSet, setShowCountdownSet] = useState(false);
  const [countdownExpired, setCountdownExpired] = useState(false);
  const flashRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (running.flight) setFlightTime(t => t + 1);
      if (running.elapsed) setElapsedTime(t => t + 1);
      if (running.countdown) {
        setCountdownTime(t => {
          const next = t - 1;
          if (next === 0) setCountdownExpired(true);
          return next;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  // Flash effect for expired countdown
  useEffect(() => {
    if (!countdownExpired) return;
    const interval = setInterval(() => {
      flashRef.current = !flashRef.current;
    }, 500);
    return () => clearInterval(interval);
  }, [countdownExpired]);

  const toggle = useCallback((id: TimerId) => {
    if (id === "countdown" && countdownExpired) {
      setCountdownExpired(false);
    }
    setRunning(prev => ({ ...prev, [id]: !prev[id] }));
  }, [countdownExpired]);

  const reset = useCallback((id: TimerId) => {
    setRunning(prev => ({ ...prev, [id]: false }));
    if (id === "flight") setFlightTime(0);
    else if (id === "elapsed") setElapsedTime(0);
    else {
      setCountdownTime(countdownInitial);
      setCountdownExpired(false);
    }
  }, [countdownInitial]);

  const handleCountdownSet = useCallback((seconds: number) => {
    setCountdownInitial(seconds);
    setCountdownTime(seconds);
    setCountdownExpired(false);
    setRunning(prev => ({ ...prev, countdown: false }));
    setShowCountdownSet(false);
  }, []);

  const timers: { id: TimerId; label: string; sublabel: string; value: number }[] = [
    { id: "flight", label: "FLT", sublabel: "Flight Time", value: flightTime },
    { id: "elapsed", label: "ETE", sublabel: "Elapsed Time", value: elapsedTime },
    { id: "countdown", label: "CDT", sublabel: "Countdown", value: countdownTime },
  ];

  const countdownProgress = countdownInitial > 0
    ? Math.max(0, Math.min(1, countdownTime / countdownInitial))
    : 0;

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white">Timers / Utilities</span>
        <span className="font-mono text-[9px] text-avionics-label">
          UTC {new Date().toISOString().slice(11, 19)}
        </span>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Section label */}
        <div className="px-3 py-1.5 border-b border-avionics-divider">
          <span className="text-[10px] text-avionics-cyan font-mono">FLIGHT TIMERS</span>
        </div>

        {timers.map(({ id, label, sublabel, value }) => {
          const isRunning = running[id];
          const isCountdown = id === "countdown";
          const isExpired = isCountdown && countdownExpired;
          const isNegative = isCountdown && value < 0;

          return (
            <div key={id} className="border-b border-avionics-divider/50">
              <div className="flex items-center justify-between px-3 py-2.5">
                {/* Label */}
                <div className="flex flex-col w-16">
                  <span className="font-mono text-[11px] text-avionics-cyan font-bold">{label}</span>
                  <span className="text-[8px] text-avionics-label">{sublabel}</span>
                </div>

                {/* Time display */}
                <div className="flex items-center gap-1">
                  {isRunning && (
                    <span className="w-1.5 h-1.5 rounded-full bg-avionics-green animate-pulse" />
                  )}
                  <span
                    className={`font-mono text-xl font-bold tracking-wider ${
                      isExpired
                        ? "text-avionics-amber avionics-glow-amber animate-pulse"
                        : isNegative
                        ? "text-avionics-amber"
                        : isRunning
                        ? "text-avionics-green avionics-glow-green"
                        : "text-avionics-white"
                    }`}
                  >
                    {formatTime(value)}
                  </span>
                </div>

                {/* Controls */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => toggle(id)}
                    className={`px-3 py-1 rounded text-[9px] font-mono avionics-bezel transition-colors ${
                      isRunning
                        ? "bg-avionics-green/20 text-avionics-green border border-avionics-green/30"
                        : "bg-avionics-button text-avionics-cyan hover:bg-avionics-button-hover"
                    }`}
                  >
                    {isRunning ? "STOP" : "START"}
                  </button>
                  <button
                    onClick={() => reset(id)}
                    className="px-3 py-1 rounded text-[9px] font-mono bg-avionics-button text-avionics-amber avionics-bezel hover:bg-avionics-button-hover transition-colors"
                  >
                    RST
                  </button>
                  {isCountdown && (
                    <button
                      onClick={() => setShowCountdownSet(prev => !prev)}
                      className={`px-2 py-1 rounded text-[9px] font-mono avionics-bezel transition-colors ${
                        showCountdownSet
                          ? "bg-avionics-cyan/20 text-avionics-cyan border border-avionics-cyan/30"
                          : "bg-avionics-button text-avionics-white hover:bg-avionics-button-hover"
                      }`}
                    >
                      SET
                    </button>
                  )}
                </div>
              </div>

              {/* Countdown progress bar */}
              {isCountdown && (
                <div className="px-3 pb-1.5">
                  <div className="h-1 bg-avionics-divider rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isExpired ? "bg-avionics-amber" : "bg-avionics-green"
                      }`}
                      style={{ width: `${countdownProgress * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Countdown setter */}
              {isCountdown && showCountdownSet && (
                <div className="px-3 pb-2 flex items-center gap-2">
                  <span className="text-[9px] text-avionics-label font-mono">SET TIME:</span>
                  <CountdownSetter onSet={handleCountdownSet} />
                </div>
              )}
            </div>
          );
        })}

        {/* Fuel Planner */}
        <div className="px-3 py-1.5 border-b border-avionics-divider mt-1">
          <span className="text-[10px] text-avionics-cyan font-mono">FUEL PLANNER</span>
        </div>
        <FuelPlanner />
      </div>
    </div>
  );
};
