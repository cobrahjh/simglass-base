import { useState } from "react";
import { useGtn } from "../GtnContext";

interface Procedure {
  name: string;
  runway: string;
  type: "SID" | "STAR" | "APCH";
}

const sampleProcedures: Record<string, Procedure[]> = {
  SID: [
    { name: "CASTA2", runway: "RW28L", type: "SID" },
    { name: "FERNS2", runway: "RW28L", type: "SID" },
    { name: "LOPIN2", runway: "RW10R", type: "SID" },
    { name: "MANNA1", runway: "ALL", type: "SID" },
  ],
  STAR: [
    { name: "BIRDI1", runway: "RW28L", type: "STAR" },
    { name: "DEDHD2", runway: "RW28L", type: "STAR" },
    { name: "KSNS2", runway: "ALL", type: "STAR" },
    { name: "OHSEA3", runway: "RW10R", type: "STAR" },
  ],
  APCH: [
    { name: "ILS RW28L", runway: "RW28L", type: "APCH" },
    { name: "RNAV (GPS) RW10R", runway: "RW10R", type: "APCH" },
    { name: "RNAV (GPS) RW28L", runway: "RW28L", type: "APCH" },
    { name: "VOR RW28L", runway: "RW28L", type: "APCH" },
    { name: "LOC RW28L", runway: "RW28L", type: "APCH" },
    { name: "VISUAL RW28L", runway: "RW28L", type: "APCH" },
  ],
};

export const ProceduresScreen = () => {
  const { navigateTo } = useGtn();
  const [activeTab, setActiveTab] = useState<"SID" | "STAR" | "APCH">("APCH");
  const [selectedProc, setSelectedProc] = useState<string | null>(null);
  const [loadedProc, setLoadedProc] = useState<string | null>(null);

  const procedures = sampleProcedures[activeTab];

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white">Procedures — KMRY</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-avionics-panel border-b border-avionics-divider">
        {(["SID", "STAR", "APCH"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedProc(null); }}
            className={`flex-1 py-2 text-center text-[10px] font-mono transition-colors border-b-2 ${
              activeTab === tab ? "text-avionics-cyan border-avionics-cyan" : "text-avionics-label border-transparent hover:text-avionics-white"
            }`}
          >
            {tab === "SID" ? "Departure" : tab === "STAR" ? "Arrival" : "Approach"}
          </button>
        ))}
      </div>

      {/* Procedure list */}
      <div className="flex-1 overflow-y-auto">
        {procedures.map((proc) => (
          <button
            key={proc.name}
            onClick={() => setSelectedProc(proc.name === selectedProc ? null : proc.name)}
            className={`w-full flex items-center justify-between px-3 py-2.5 border-b border-avionics-divider/30 transition-colors ${
              selectedProc === proc.name ? "bg-avionics-button-active" : loadedProc === proc.name ? "bg-avionics-green/5" : "hover:bg-avionics-button-hover/50"
            }`}
          >
            <div className="flex items-center gap-2">
              {loadedProc === proc.name && (
                <svg width="8" height="10" viewBox="0 0 8 10" className="text-avionics-green shrink-0">
                  <polygon points="0,0 8,5 0,10" fill="currentColor" />
                </svg>
              )}
              <span className={`font-mono text-xs ${loadedProc === proc.name ? "text-avionics-green" : "text-avionics-white"}`}>
                {proc.name}
              </span>
            </div>
            <span className="font-mono text-[10px] text-avionics-label">{proc.runway}</span>
          </button>
        ))}
      </div>

      {/* Action buttons */}
      {selectedProc && (
        <div className="flex items-stretch border-t border-avionics-divider bg-avionics-panel">
          <button
            onClick={() => { setLoadedProc(selectedProc); setSelectedProc(null); }}
            className="flex-1 py-2.5 text-center font-mono text-[10px] text-avionics-green hover:bg-avionics-button-hover border-r border-avionics-divider transition-colors"
          >
            Load {activeTab === "SID" ? "Departure" : activeTab === "STAR" ? "Arrival" : "Approach"}
          </button>
          <button
            onClick={() => {
              setLoadedProc(selectedProc);
              setSelectedProc(null);
              navigateTo("map");
            }}
            className="flex-1 py-2.5 text-center font-mono text-[10px] text-avionics-cyan hover:bg-avionics-button-hover transition-colors"
          >
            Activate
          </button>
        </div>
      )}

      {/* Loaded info */}
      {loadedProc && (
        <div className="flex items-center justify-between px-3 py-1 border-t border-avionics-divider bg-avionics-panel">
          <span className="text-[9px] text-avionics-label">Loaded:</span>
          <span className="font-mono text-[9px] text-avionics-green">{loadedProc}</span>
        </div>
      )}
    </div>
  );
};
