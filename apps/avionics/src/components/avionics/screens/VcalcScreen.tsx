import { useState, useEffect, useMemo } from "react";
import { useFlightData } from "../FlightDataContext";
import { useGtn } from "../GtnContext";
import { ArrowDown, Target, TrendingDown } from "lucide-react";

type VcalcStatus = "above" | "approaching" | "descending" | "at-target" | "below";

export const VcalcScreen = () => {
  const { flight, navigation } = useFlightData();
  const { flightPlan } = useGtn();

  const [targetAlt, setTargetAlt] = useState(3000);
  const [offset, setOffset] = useState(0);
  const [descentAngle, setDescentAngle] = useState(3);
  const [enabled, setEnabled] = useState(true);

  // Pick target waypoint (destination airport)
  const targetWaypoint = useMemo(() => {
    const airports = flightPlan.filter(wp => wp.type === "airport");
    return airports.length > 1 ? airports[airports.length - 1] : null;
  }, [flightPlan]);

  // Calculations
  const altDiff = flight.altitude - targetAlt;
  const distToTarget = navigation.distanceRemaining + offset;
  const tanAngle = Math.tan((descentAngle * Math.PI) / 180);

  // Distance needed at given descent angle
  const distNeeded = tanAngle > 0 ? altDiff / (tanAngle * 6076.12) : 0; // ft / (tan * ft/nm)
  const distToTOD = Math.max(0, distToTarget - distNeeded);

  // Time to TOD
  const timeToTOD = flight.groundSpeed > 0 ? (distToTOD / flight.groundSpeed) * 60 : 0; // minutes

  // Required VS to make target
  const timeToTargetMin = flight.groundSpeed > 0 ? (distToTarget / flight.groundSpeed) * 60 : 0;
  const vsRequired = timeToTargetMin > 0 ? -(altDiff / timeToTargetMin) : 0;

  // Status
  const status: VcalcStatus = useMemo(() => {
    if (Math.abs(altDiff) < 100) return "at-target";
    if (altDiff < -100) return "below";
    if (distToTOD < 0.5) return "descending";
    if (distToTOD < 3) return "approaching";
    return "above";
  }, [altDiff, distToTOD]);

  const statusText: Record<VcalcStatus, string> = {
    "above": "CRUISE — ABOVE TARGET",
    "approaching": "⚠ APPROACHING TOD",
    "descending": "↓ DESCEND TO TARGET",
    "at-target": "✓ AT TARGET ALTITUDE",
    "below": "↑ BELOW TARGET",
  };

  const statusColor: Record<VcalcStatus, string> = {
    "above": "text-avionics-cyan",
    "approaching": "text-avionics-amber",
    "descending": "text-avionics-green",
    "at-target": "text-avionics-green",
    "below": "text-avionics-amber",
  };

  const InputRow = ({ label, value, unit, onInc, onDec }: { label: string; value: string | number; unit: string; onInc: () => void; onDec: () => void }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-avionics-divider/50">
      <span className="text-[9px] text-avionics-label font-mono uppercase">{label}</span>
      <div className="flex items-center gap-1">
        <button onClick={onDec} className="w-5 h-5 rounded bg-avionics-button text-avionics-white text-xs hover:bg-avionics-button-hover">−</button>
        <span className="font-mono text-sm text-avionics-cyan w-16 text-center">{value}</span>
        <button onClick={onInc} className="w-5 h-5 rounded bg-avionics-button text-avionics-white text-xs hover:bg-avionics-button-hover">+</button>
        <span className="text-[8px] text-avionics-label ml-1">{unit}</span>
      </div>
    </div>
  );

  const OutputRow = ({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-avionics-divider/50">
      <span className="text-[9px] text-avionics-label font-mono uppercase">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`font-mono text-sm ${color || "text-avionics-white"}`}>{value}</span>
        {unit && <span className="text-[8px] text-avionics-label">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-avionics-divider bg-avionics-panel">
        <div className="flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-avionics-cyan" />
          <span className="font-mono text-[10px] text-avionics-cyan tracking-wider">VCALC</span>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`font-mono text-[9px] px-2 py-0.5 rounded border ${
            enabled ? "border-avionics-green text-avionics-green bg-avionics-green/10" : "border-avionics-divider text-avionics-label"
          }`}
        >
          {enabled ? "ENABLED" : "DISABLED"}
        </button>
      </div>

      {/* Status bar */}
      <div className={`px-3 py-1.5 border-b border-avionics-divider ${
        status === "approaching" || status === "descending" ? "bg-avionics-amber/10" : "bg-avionics-panel/50"
      }`}>
        <span className={`font-mono text-[10px] font-bold ${statusColor[status]}`}>
          {enabled ? statusText[status] : "VCALC DISABLED"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* Inputs */}
        <div className="bg-avionics-panel rounded-lg border border-avionics-divider p-3">
          <span className="text-[9px] text-avionics-label font-mono block mb-2">CONFIGURATION</span>
          <InputRow
            label="Target Altitude"
            value={targetAlt.toLocaleString()}
            unit="FT"
            onInc={() => setTargetAlt(a => Math.min(a + 500, 45000))}
            onDec={() => setTargetAlt(a => Math.max(a - 500, 0))}
          />
          <InputRow
            label="Descent Angle"
            value={`${descentAngle.toFixed(1)}°`}
            unit=""
            onInc={() => setDescentAngle(a => Math.min(a + 0.5, 6))}
            onDec={() => setDescentAngle(a => Math.max(a - 0.5, 1))}
          />
          <InputRow
            label="Offset Before WPT"
            value={offset}
            unit="NM"
            onInc={() => setOffset(o => Math.min(o + 1, 30))}
            onDec={() => setOffset(o => Math.max(o - 1, 0))}
          />
          {targetWaypoint && (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[9px] text-avionics-label font-mono">TARGET WPT</span>
              <span className="font-mono text-sm text-avionics-magenta">{targetWaypoint.name}</span>
            </div>
          )}
        </div>

        {/* Outputs */}
        <div className="bg-avionics-panel rounded-lg border border-avionics-divider p-3">
          <span className="text-[9px] text-avionics-label font-mono block mb-2">CALCULATIONS</span>
          <OutputRow label="Current ALT" value={Math.round(flight.altitude).toLocaleString()} unit="FT" />
          <OutputRow label="ALT Difference" value={`${altDiff > 0 ? "↓" : "↑"} ${Math.abs(Math.round(altDiff)).toLocaleString()}`} unit="FT" color={altDiff > 0 ? "text-avionics-cyan" : "text-avionics-amber"} />
          <OutputRow label="Dist to TOD" value={distToTOD.toFixed(1)} unit="NM" color="text-avionics-green" />
          <OutputRow
            label="Time to TOD"
            value={timeToTOD > 0 ? `${Math.floor(timeToTOD)}:${String(Math.round((timeToTOD % 1) * 60)).padStart(2, "0")}` : "--:--"}
            color="text-avionics-cyan"
          />
          <OutputRow label="VS Required" value={Math.round(vsRequired)} unit="FPM" color={Math.abs(vsRequired) > 1000 ? "text-avionics-amber" : "text-avionics-green"} />
          <OutputRow label="Dist to Target" value={distToTarget.toFixed(1)} unit="NM" />
        </div>
      </div>

      <div className="flex items-center justify-end px-3 py-1 border-t border-avionics-divider">
        <span className="font-mono text-[10px] text-avionics-cyan">VCALC</span>
      </div>
    </div>
  );
};
