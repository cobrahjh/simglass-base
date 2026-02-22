import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useFlightData } from "./FlightDataContext";

export const NavInfoStrip = () => {
  const { navigation, flight } = useFlightData();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex items-center bg-avionics-panel border-b border-avionics-divider px-2 py-1 gap-2">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="shrink-0 hover:bg-avionics-button-hover transition-colors rounded px-0.5"
        title={collapsed ? "Expand nav info" : "Collapse nav info"}
      >
        {collapsed
          ? <ChevronDown className="w-3 h-3 text-avionics-cyan" />
          : <ChevronUp className="w-3 h-3 text-avionics-cyan" />
        }
      </button>

      {collapsed ? (
        <span className="font-mono text-[10px] text-avionics-label truncate">
          DTK {navigation.dtk.toString().padStart(3, "0")}° · GS {flight.groundSpeed} · {flight.altitude.toLocaleString()}FT
        </span>
      ) : (
        <>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-avionics-label">DTK</span>
            <span className="font-mono text-lg text-avionics-magenta avionics-glow-magenta font-bold">
              {navigation.dtk.toString().padStart(3, "0")}°
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-avionics-green avionics-glow-green">{navigation.distanceToNext}</span>
            <div className="flex flex-col">
              <span className="font-mono text-xs text-avionics-cyan">{flight.altitude.toLocaleString()}<span className="text-[9px] text-avionics-label ml-0.5">FT</span></span>
              <span className="font-mono text-xs text-avionics-white">{navigation.nextWaypoint}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-avionics-label">GS</span>
            <span className="font-mono text-sm text-avionics-green">{flight.groundSpeed}</span>
          </div>
          <div className="ml-auto">
            <span className="text-[10px] text-avionics-label">TRK UP</span>
          </div>
        </>
      )}
    </div>
  );
};
