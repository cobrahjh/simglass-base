import { useGtn } from "../GtnContext";
import { AlertTriangle, Plane, Navigation } from "lucide-react";

const nearestGlideAirports = [
  { id: "KSNS", name: "Salinas Municipal", dist: 8, brg: 135, rwy: "08/26", elev: 85, glideOk: true },
  { id: "KWVI", name: "Watsonville Muni", dist: 14, brg: 290, rwy: "02/20", elev: 163, glideOk: true },
  { id: "KMRY", name: "Monterey Regional", dist: 22, brg: 315, rwy: "10R/28L", elev: 257, glideOk: true },
  { id: "KCVH", name: "Hollister Muni", dist: 28, brg: 45, rwy: "13/31", elev: 230, glideOk: false },
  { id: "KSJC", name: "San Jose Intl", dist: 45, brg: 340, rwy: "12L/30R", elev: 62, glideOk: false },
];

export const EmergencyScreen = () => {
  const { smartGlideActive, emergencyDescentActive, toggleSmartGlide, toggleEmergencyDescent, activateDirectTo, xpdrCode } = useGtn();

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      {/* Header - red when active */}
      <div className={`flex items-center justify-between px-3 py-2 border-b border-avionics-divider ${
        smartGlideActive || emergencyDescentActive ? "bg-destructive/20" : "bg-avionics-panel"
      }`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${smartGlideActive || emergencyDescentActive ? "text-destructive" : "text-avionics-amber"}`} />
          <span className="font-mono text-xs text-avionics-white">Emergency</span>
        </div>
        {smartGlideActive && (
          <span className="font-mono text-[10px] text-destructive animate-pulse">SMART GLIDE ACTIVE</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Smart Glide */}
        <div className="px-3 py-3 border-b border-avionics-divider">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-mono text-xs text-avionics-white block">Smart Glide</span>
              <span className="text-[9px] text-avionics-label">Auto-navigate to nearest suitable airport</span>
            </div>
            <button
              onClick={toggleSmartGlide}
              className={`px-4 py-2 rounded font-mono text-[10px] avionics-bezel transition-colors ${
                smartGlideActive
                  ? "bg-destructive/30 text-destructive border border-destructive/50"
                  : "bg-avionics-amber/20 text-avionics-amber hover:bg-avionics-amber/30"
              }`}
            >
              {smartGlideActive ? "Deactivate" : "Activate"}
            </button>
          </div>

          {smartGlideActive && (
            <div className="mt-3 p-2 rounded bg-avionics-inset border border-avionics-divider">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-3.5 h-3.5 text-avionics-green" />
                <span className="font-mono text-[10px] text-avionics-green">Gliding to KSNS — 8 NM</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[8px] text-avionics-label block">GS</span>
                  <span className="font-mono text-xs text-avionics-white">85 KT</span>
                </div>
                <div>
                  <span className="text-[8px] text-avionics-label block">XPDR</span>
                  <span className="font-mono text-xs text-destructive">{xpdrCode}</span>
                </div>
                <div>
                  <span className="text-[8px] text-avionics-label block">ETE</span>
                  <span className="font-mono text-xs text-avionics-cyan">5:38</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Descent */}
        <div className="px-3 py-3 border-b border-avionics-divider">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="font-mono text-xs text-avionics-white block">Emergency Descent</span>
              <span className="text-[9px] text-avionics-label">Initiate controlled emergency descent</span>
            </div>
            <button
              onClick={toggleEmergencyDescent}
              className={`px-4 py-2 rounded font-mono text-[10px] avionics-bezel transition-colors ${
                emergencyDescentActive
                  ? "bg-destructive/30 text-destructive border border-destructive/50"
                  : "bg-avionics-button text-avionics-amber hover:bg-avionics-button-hover"
              }`}
            >
              {emergencyDescentActive ? "Cancel EDM" : "Activate EDM"}
            </button>
          </div>
          {emergencyDescentActive && (
            <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/30">
              <span className="font-mono text-[10px] text-destructive">EMERGENCY DESCENT MODE — Follow autopilot guidance</span>
            </div>
          )}
        </div>

        {/* Nearest airports for glide */}
        <div className="px-3 py-2 border-b border-avionics-divider bg-avionics-panel/50">
          <span className="text-[9px] text-avionics-label">Nearest Airports (Glide Range)</span>
        </div>
        {nearestGlideAirports.map(apt => (
          <button
            key={apt.id}
            onClick={() => activateDirectTo(apt.id)}
            className="w-full flex items-center justify-between px-3 py-2.5 border-b border-avionics-divider/30 hover:bg-avionics-button-hover/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${apt.glideOk ? "bg-avionics-green" : "bg-avionics-amber"}`} />
              <div>
                <span className="font-mono text-xs text-avionics-white block">{apt.id}</span>
                <span className="text-[8px] text-avionics-label">{apt.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <span className="font-mono text-[10px] text-avionics-green block">{apt.dist} NM</span>
                <span className="font-mono text-[9px] text-avionics-magenta">{apt.brg}°</span>
              </div>
              <div>
                <span className="text-[8px] text-avionics-label block">{apt.rwy}</span>
                <span className="text-[8px] text-avionics-label">{apt.elev} ft</span>
              </div>
              <Navigation className="w-3 h-3 text-avionics-cyan" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
