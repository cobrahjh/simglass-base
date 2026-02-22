import { useState, useMemo } from "react";
import { useFlightData } from "../FlightDataContext";
import { useGtn } from "../GtnContext";
import { MapPin, Route } from "lucide-react";

type TripMode = "p2p" | "fpl";

export const TripPlanningScreen = () => {
  const { flight, navigation } = useFlightData();
  const { flightPlan } = useGtn();

  const [mode, setMode] = useState<TripMode>("fpl");
  const [useSensor, setUseSensor] = useState(true);
  const [manualGS, setManualGS] = useState(120);
  const [selectedLegIdx, setSelectedLegIdx] = useState(0);

  const gs = useSensor && flight.groundSpeed > 0 ? flight.groundSpeed : manualGS;

  // FPL mode calculations
  const fplLegs = useMemo(() => {
    return flightPlan.map((wp, i) => {
      const prevWp = i > 0 ? flightPlan[i - 1] : null;
      const dis = wp.dis || 0;
      const eteMin = gs > 0 ? (dis / gs) * 60 : 0;
      return {
        name: wp.name,
        type: wp.type,
        dtk: wp.dtk,
        dis,
        eteMin,
        ete: `${Math.floor(eteMin)}:${String(Math.round((eteMin % 1) * 60)).padStart(2, "0")}`,
        alt: wp.alt || 0,
      };
    });
  }, [flightPlan, gs]);

  const selectedLeg = fplLegs[selectedLegIdx] || fplLegs[0];

  // Total route stats
  const totalDist = fplLegs.reduce((sum, l) => sum + l.dis, 0);
  const totalEteMin = gs > 0 ? (totalDist / gs) * 60 : 0;
  const totalEte = `${Math.floor(totalEteMin)}:${String(Math.round((totalEteMin % 1) * 60)).padStart(2, "0")}`;

  // ETA calculation
  const now = new Date();
  const etaDate = new Date(now.getTime() + totalEteMin * 60 * 1000);
  const eta = `${etaDate.getUTCHours().toString().padStart(2, "0")}:${etaDate.getUTCMinutes().toString().padStart(2, "0")} UTC`;

  // ESA (En Route Safe Altitude) — highest waypoint alt + 1000
  const esa = Math.max(...fplLegs.map(l => l.alt)) + 1000;

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-avionics-divider bg-avionics-panel">
        <div className="flex items-center gap-1.5">
          <Route className="w-3.5 h-3.5 text-avionics-cyan" />
          <span className="font-mono text-[10px] text-avionics-cyan tracking-wider">TRIP PLANNING</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === "fpl" ? "p2p" : "fpl")}
            className="font-mono text-[9px] px-2 py-0.5 rounded border border-avionics-divider text-avionics-label hover:text-avionics-white"
          >
            {mode === "fpl" ? "FPL MODE" : "P2P MODE"}
          </button>
          <button
            onClick={() => setUseSensor(!useSensor)}
            className={`font-mono text-[9px] px-2 py-0.5 rounded border ${
              useSensor ? "border-avionics-green text-avionics-green" : "border-avionics-divider text-avionics-label"
            }`}
          >
            SENSOR
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* GS input when not using sensor */}
        {!useSensor && (
          <div className="bg-avionics-panel rounded-lg border border-avionics-divider p-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-avionics-label font-mono">GROUND SPEED</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setManualGS(g => Math.max(g - 10, 50))} className="w-5 h-5 rounded bg-avionics-button text-avionics-white text-xs">−</button>
                <span className="font-mono text-sm text-avionics-cyan w-12 text-center">{manualGS}</span>
                <button onClick={() => setManualGS(g => Math.min(g + 10, 500))} className="w-5 h-5 rounded bg-avionics-button text-avionics-white text-xs">+</button>
                <span className="text-[8px] text-avionics-label">KT</span>
              </div>
            </div>
          </div>
        )}

        {/* Route summary */}
        <div className="bg-avionics-panel rounded-lg border border-avionics-divider p-3">
          <span className="text-[9px] text-avionics-label font-mono block mb-2">
            {mode === "fpl" ? "ACTIVE FLIGHT PLAN" : "POINT TO POINT"}
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex items-center justify-between py-1 border-b border-avionics-divider/50">
              <span className="text-[8px] text-avionics-label font-mono">TOTAL DIS</span>
              <span className="font-mono text-xs text-avionics-white">{totalDist.toFixed(1)} <span className="text-[7px] text-avionics-label">NM</span></span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-avionics-divider/50">
              <span className="text-[8px] text-avionics-label font-mono">ETE</span>
              <span className="font-mono text-xs text-avionics-cyan">{totalEte}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-avionics-divider/50">
              <span className="text-[8px] text-avionics-label font-mono">ETA</span>
              <span className="font-mono text-xs text-avionics-green">{eta}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-avionics-divider/50">
              <span className="text-[8px] text-avionics-label font-mono">GS</span>
              <span className="font-mono text-xs text-avionics-white">{gs} <span className="text-[7px] text-avionics-label">KT</span></span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-avionics-divider/50">
              <span className="text-[8px] text-avionics-label font-mono">ESA</span>
              <span className="font-mono text-xs text-avionics-amber">{esa.toLocaleString()} <span className="text-[7px] text-avionics-label">FT</span></span>
            </div>
          </div>
        </div>

        {/* Leg selector */}
        <div className="bg-avionics-panel rounded-lg border border-avionics-divider p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-avionics-label font-mono">LEG DETAILS</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setSelectedLegIdx(i => Math.max(0, i - 1))} className="w-5 h-5 rounded bg-avionics-button text-avionics-white text-xs hover:bg-avionics-button-hover">◀</button>
              <span className="font-mono text-[9px] text-avionics-cyan w-8 text-center">{selectedLegIdx + 1}/{fplLegs.length}</span>
              <button onClick={() => setSelectedLegIdx(i => Math.min(fplLegs.length - 1, i + 1))} className="w-5 h-5 rounded bg-avionics-button text-avionics-white text-xs hover:bg-avionics-button-hover">▶</button>
            </div>
          </div>

          {selectedLeg && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-3 h-3 text-avionics-magenta" />
                <span className="font-mono text-sm text-avionics-magenta">{selectedLeg.name}</span>
                <span className="font-mono text-[8px] text-avionics-label uppercase">{selectedLeg.type}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-avionics-divider/50">
                <span className="text-[8px] text-avionics-label font-mono">DTK</span>
                <span className="font-mono text-xs text-avionics-magenta">{selectedLeg.dtk}°</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-avionics-divider/50">
                <span className="text-[8px] text-avionics-label font-mono">DIS</span>
                <span className="font-mono text-xs text-avionics-white">{selectedLeg.dis} NM</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-avionics-divider/50">
                <span className="text-[8px] text-avionics-label font-mono">ETE</span>
                <span className="font-mono text-xs text-avionics-cyan">{selectedLeg.ete}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-avionics-divider/50">
                <span className="text-[8px] text-avionics-label font-mono">ALT</span>
                <span className="font-mono text-xs text-avionics-amber">{selectedLeg.alt.toLocaleString()} FT</span>
              </div>
            </div>
          )}
        </div>

        {/* Leg overview table */}
        <div className="bg-avionics-panel rounded-lg border border-avionics-divider p-3">
          <span className="text-[9px] text-avionics-label font-mono block mb-2">ROUTE</span>
          <div className="flex items-center px-1 py-0.5 border-b border-avionics-divider/50 text-[7px] text-avionics-label font-mono">
            <span className="w-14">WPT</span>
            <span className="w-10 text-right">DTK</span>
            <span className="w-10 text-right">DIS</span>
            <span className="w-12 text-right">ETE</span>
          </div>
          {fplLegs.map((leg, i) => (
            <button
              key={i}
              onClick={() => setSelectedLegIdx(i)}
              className={`flex items-center px-1 py-1 w-full text-left border-b border-avionics-divider/30 ${
                i === selectedLegIdx ? "bg-avionics-cyan/10" : "hover:bg-avionics-button-hover"
              }`}
            >
              <span className={`w-14 font-mono text-[9px] ${leg.type === "airport" ? "text-avionics-cyan" : "text-avionics-white"}`}>{leg.name}</span>
              <span className="w-10 font-mono text-[9px] text-avionics-magenta text-right">{leg.dtk}°</span>
              <span className="w-10 font-mono text-[9px] text-avionics-white text-right">{leg.dis}</span>
              <span className="w-12 font-mono text-[9px] text-avionics-label text-right">{leg.ete}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end px-3 py-1 border-t border-avionics-divider">
        <span className="font-mono text-[10px] text-avionics-cyan">TRIP</span>
      </div>
    </div>
  );
};
