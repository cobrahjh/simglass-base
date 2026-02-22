import { useGtn } from "../GtnContext";
import { Navigation } from "lucide-react";

const nearestAirports = [
  { id: "KSNS", name: "Salinas Municipal", dist: 0, brg: 0, rwy: "08/26", elev: 85, freq: "118.40" },
  { id: "KWVI", name: "Watsonville Muni", dist: 18, brg: 290, rwy: "02/20", elev: 163, freq: "124.00" },
  { id: "KMRY", name: "Monterey Regional", dist: 22, brg: 315, rwy: "10R/28L", elev: 257, freq: "118.40" },
  { id: "KCVH", name: "Hollister Muni", dist: 28, brg: 45, rwy: "13/31", elev: 230, freq: "123.00" },
  { id: "KSJC", name: "San Jose Intl", dist: 45, brg: 340, rwy: "12L/30R", elev: 62, freq: "124.00" },
  { id: "KOAK", name: "Oakland Intl", dist: 72, brg: 330, rwy: "12/30", elev: 9, freq: "118.30" },
];

export const NearestScreen = () => {
  const { activateDirectTo } = useGtn();

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      <div className="flex items-center px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white">Nearest Airports</span>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-3 py-1 bg-avionics-panel/50 border-b border-avionics-divider/50">
        <span className="flex-1 text-[8px] text-avionics-label">Airport</span>
        <span className="w-14 text-[8px] text-avionics-label text-right">BRG</span>
        <span className="w-14 text-[8px] text-avionics-label text-right">DIS</span>
        <span className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {nearestAirports.map(apt => (
          <button
            key={apt.id}
            onClick={() => activateDirectTo(apt.id)}
            className="w-full flex items-center px-3 py-2.5 border-b border-avionics-divider/30 hover:bg-avionics-button-hover/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" className="text-avionics-cyan shrink-0">
                  <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1" />
                  <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span className="font-mono text-xs text-avionics-white">{apt.id}</span>
              </div>
              <span className="text-[8px] text-avionics-label ml-5">{apt.name}</span>
              <div className="flex items-center gap-2 ml-5 mt-0.5">
                <span className="text-[8px] text-avionics-label">RWY: {apt.rwy}</span>
                <span className="text-[8px] text-avionics-label">Elev: {apt.elev}ft</span>
              </div>
            </div>
            <span className="w-14 font-mono text-[10px] text-avionics-magenta text-right">{apt.brg}°</span>
            <span className="w-14 font-mono text-[10px] text-avionics-green text-right">{apt.dist} NM</span>
            <Navigation className="w-3 h-3 text-avionics-cyan ml-2" />
          </button>
        ))}
      </div>
    </div>
  );
};
