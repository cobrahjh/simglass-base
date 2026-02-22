import { useState } from "react";
import { useGtn } from "../GtnContext";

const nearestAirports = [
  { id: "KMRY", name: "Monterey Regional", dist: 42, brg: 315, rwy: "10R/28L", elev: 257 },
  { id: "KSNS", name: "Salinas Municipal", dist: 0, brg: 0, rwy: "08/26", elev: 85 },
  { id: "KWVI", name: "Watsonville Muni", dist: 18, brg: 290, rwy: "02/20", elev: 163 },
  { id: "KSJC", name: "San Jose Intl", dist: 45, brg: 340, rwy: "12L/30R", elev: 62 },
  { id: "KCVH", name: "Hollister Muni", dist: 22, brg: 45, rwy: "13/31", elev: 230 },
];

export const DirectToScreen = () => {
  const { activateDirectTo, navigateTo, flightPlan } = useGtn();
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<"fpl" | "nrst" | "recent">("fpl");

  const fplWaypoints = flightPlan.map(wp => wp.name);
  const recentWaypoints = ["KSFO", "KLAX", "KOAK", "KSJC", "KMRY"];

  const getList = () => {
    if (activeTab === "fpl") return fplWaypoints;
    if (activeTab === "nrst") return nearestAirports.map(a => a.id);
    return recentWaypoints;
  };

  const filtered = searchText
    ? getList().filter(w => w.toLowerCase().includes(searchText.toLowerCase()))
    : getList();

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white">Direct To →</span>
        <button onClick={() => navigateTo("map")} className="text-[10px] text-avionics-cyan">Cancel</button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-avionics-panel border-b border-avionics-divider">
        <div className="flex items-center gap-2 bg-avionics-inset rounded px-2 py-1.5">
          <span className="text-[10px] text-avionics-label">WPT:</span>
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value.toUpperCase())}
            placeholder="Enter Identifier"
            className="flex-1 bg-transparent font-mono text-sm text-avionics-cyan outline-none placeholder:text-avionics-divider"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-avionics-panel border-b border-avionics-divider">
        {([["fpl", "FPL"], ["nrst", "Nearest"], ["recent", "Recent"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 py-1.5 text-center text-[10px] font-mono border-b-2 transition-colors ${
              activeTab === key ? "text-avionics-cyan border-avionics-cyan" : "text-avionics-label border-transparent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(wp => {
          const airport = activeTab === "nrst" ? nearestAirports.find(a => a.id === wp) : null;
          return (
            <button
              key={wp}
              onClick={() => activateDirectTo(wp)}
              className="w-full flex items-center justify-between px-3 py-2.5 border-b border-avionics-divider/30 hover:bg-avionics-button-hover/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 12 12" className="text-avionics-cyan shrink-0">
                  <polygon points="6,1 11,6 6,11 1,6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span className="font-mono text-xs text-avionics-white">{wp}</span>
                {airport && <span className="text-[9px] text-avionics-label ml-1">{airport.name}</span>}
              </div>
              {airport && (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-avionics-green">{airport.dist} NM</span>
                  <span className="font-mono text-[10px] text-avionics-magenta">{airport.brg}°</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
