import { useGtn } from "./GtnContext";
import { useState, useEffect, useRef } from "react";

export const CdiBar = () => {
  const { obsMode, obsCourse, directToTarget, flightPlan, activeWaypointIndex } = useGtn();

  // Animated CDI deviation using smooth sine-based drift
  const [lateralDev, setLateralDev] = useState(0.15);
  const [verticalDev, setVerticalDev] = useState(-0.1);
  const [gs, setGs] = useState(125);
  const [trk, setTrk] = useState(298);
  const [brg, setBrg] = useState(315);
  const timeRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      timeRef.current += 0.05;
      const t = timeRef.current;
      setLateralDev(
        Math.sin(t * 0.7) * 0.35 + Math.sin(t * 1.9) * 0.15 + Math.sin(t * 0.3) * 0.1
      );
      setVerticalDev(
        Math.sin(t * 0.5 + 1) * 0.25 + Math.sin(t * 1.3) * 0.1
      );
      // GS: cruise ~125kt with slight variation
      setGs(Math.round(125 + Math.sin(t * 0.4) * 3 + Math.sin(t * 1.1) * 1.5));
      // TRK: drifting around DTK
      setTrk(Math.round(298 + Math.sin(t * 0.6) * 4 + Math.sin(t * 1.5) * 1.5));
      // BRG: slowly changing bearing to next waypoint
      setBrg(Math.round(315 + Math.sin(t * 0.3) * 3 + Math.sin(t * 0.8) * 1));
    }, 60);
    return () => clearInterval(interval);
  }, []);

  const activeWp = flightPlan[activeWaypointIndex];
  const courseTo = directToTarget || activeWp?.name || "---";
  const dtk = obsMode ? obsCourse : activeWp?.dtk || 0;

  const dotCount = 5;
  const dots = Array.from({ length: dotCount * 2 + 1 }, (_, i) => i - dotCount);

  return (
    <div className="flex flex-col gap-0.5 px-2 py-1 bg-avionics-panel border-t border-avionics-divider">
      {/* Lateral CDI */}
      <div className="flex items-center gap-1.5">
        <span className="text-[8px] text-avionics-label w-6">CDI</span>
        <div className="flex-1 flex items-center justify-center relative h-3">
          {/* Dot scale */}
          {dots.map((d) => (
            <div
              key={`lat-${d}`}
              className={`w-1.5 h-1.5 rounded-full mx-[3px] ${
                d === 0
                  ? "bg-avionics-white"
                  : "border border-avionics-divider"
              }`}
            />
          ))}
          {/* Needle */}
          <div
            className="absolute top-0 h-3 w-[2px] bg-avionics-magenta rounded transition-[left] duration-75 ease-out"
            style={{
              left: `calc(50% + ${Math.max(-1, Math.min(1, lateralDev)) * 45}%)`,
              transform: "translateX(-50%)",
            }}
          />
        </div>
        <span className="font-mono text-[9px] text-avionics-magenta w-8 text-right">{dtk}°</span>
      </div>

      {/* Vertical deviation (GS / GP) */}
      <div className="flex items-center gap-1.5">
        <span className="text-[8px] text-avionics-label w-6">GS</span>
        <div className="flex-1 flex items-center justify-center relative h-3">
          {dots.map((d) => (
            <div
              key={`vert-${d}`}
              className={`w-1.5 h-1.5 rounded-full mx-[3px] ${
                d === 0
                  ? "bg-avionics-white"
                  : "border border-avionics-divider"
              }`}
            />
          ))}
          <div
            className="absolute top-0 h-3 w-[2px] bg-avionics-green rounded transition-[left] duration-75 ease-out"
            style={{
              left: `calc(50% + ${Math.max(-1, Math.min(1, verticalDev)) * 45}%)`,
              transform: "translateX(-50%)",
            }}
          />
        </div>
        <span className="font-mono text-[9px] text-avionics-cyan w-8 text-right">{courseTo}</span>
      </div>

      {/* GS / TRK / BRG strip */}
      <div className="flex items-center justify-between mt-0.5 pt-1 border-t border-avionics-divider/50">
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-avionics-label">GS</span>
          <span className="font-mono text-[10px] text-avionics-green">{gs}</span>
          <span className="text-[7px] text-avionics-label">KT</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-avionics-label">TRK</span>
          <span className="font-mono text-[10px] text-avionics-magenta">{trk}°</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-avionics-label">BRG</span>
          <span className="font-mono text-[10px] text-avionics-cyan">{brg}°</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-avionics-label">DTK</span>
          <span className="font-mono text-[10px] text-avionics-magenta">{dtk}°</span>
        </div>
      </div>
    </div>
  );
};
