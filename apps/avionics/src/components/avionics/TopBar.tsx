import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useGtn } from "./GtnContext";

interface FrequencyDisplayProps {
  label: string;
  activeFreq: string;
  standbyFreq: string;
  standbyLabel?: string;
  onStandbyClick?: () => void;
}

const FrequencyDisplay = ({ label, activeFreq, standbyFreq, standbyLabel, onStandbyClick }: FrequencyDisplayProps) => (
  <div className="flex flex-col items-start gap-0.5">
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] text-avionics-label uppercase tracking-wider">{label}</span>
      <span className="font-mono text-lg text-avionics-green avionics-glow-green font-bold leading-none">
        {activeFreq}
      </span>
    </div>
    <button onClick={onStandbyClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <span className="text-[10px] text-avionics-label uppercase tracking-wider">
        {standbyLabel || "STBY"}
      </span>
      <span className="font-mono text-sm text-avionics-cyan leading-none">
        {standbyFreq}
      </span>
    </button>
  </div>
);

export const TopBar = () => {
  const { com, nav, xpdrCode, xpdrMode, toggleComPanel, toggleAudioPanel, toggleXpdrPanel } = useGtn();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex items-center bg-avionics-panel border-b border-avionics-divider relative">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="shrink-0 px-1 py-1 hover:bg-avionics-button-hover transition-colors border-r border-avionics-divider self-stretch flex items-center"
        title={collapsed ? "Expand frequencies" : "Collapse frequencies"}
      >
        {collapsed
          ? <ChevronDown className="w-3 h-3 text-avionics-cyan" />
          : <ChevronUp className="w-3 h-3 text-avionics-cyan" />
        }
      </button>

      {collapsed ? (
        <div className="flex items-center gap-3 px-2 py-1 font-mono text-[10px] truncate">
          <span className="text-avionics-green">{com.activeLabel} {com.activeFreq}</span>
          <span className="text-avionics-label">XPDR</span>
          <span className="text-avionics-green">{xpdrCode}</span>
          <span className={xpdrMode === "ALT" ? "text-avionics-green" : "text-avionics-label"}>{xpdrMode}</span>
          <span className="text-avionics-green">NAV {nav.activeFreq}</span>
        </div>
      ) : (
        <div className="flex items-stretch flex-1">
          {/* COM Frequencies */}
          <div className="flex items-center px-2 py-1.5 border-r border-avionics-divider">
            <div className="flex flex-col mr-1">
              <span className="text-[9px] text-avionics-label">COM</span>
              <span className="text-[9px] text-avionics-label">Vol</span>
              <span className="text-[8px] text-avionics-label">Psh</span>
              <span className="text-[8px] text-avionics-label">Sq</span>
            </div>
            <FrequencyDisplay
              label={com.activeLabel}
              activeFreq={com.activeFreq}
              standbyFreq={com.standbyFreq}
              standbyLabel={com.standbyLabel || "STBY"}
              onStandbyClick={toggleComPanel}
            />
          </div>

          {/* Audio Panel */}
          <button onClick={toggleAudioPanel} className="flex flex-col items-center justify-center px-3 py-1.5 border-r border-avionics-divider hover:bg-avionics-button-hover transition-colors">
            <span className="text-[10px] text-avionics-white font-medium">Audio</span>
            <span className="text-[10px] text-avionics-white font-medium">Panel</span>
          </button>

          {/* MIC/MON */}
          <div className="flex flex-col items-end justify-center px-2 py-1.5 border-r border-avionics-divider gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-avionics-label">MIC</span>
              <span className="bg-avionics-green text-primary-foreground text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-sm">1</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-avionics-label">MON</span>
              <span className="bg-avionics-green text-primary-foreground text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-sm">1</span>
            </div>
          </div>

          {/* XPDR */}
          <button onClick={toggleXpdrPanel} className="flex items-center gap-1 px-2 py-1.5 border-r border-avionics-divider hover:bg-avionics-button-hover transition-colors">
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-avionics-label">XPDR</span>
              <span className="font-mono text-sm text-avionics-green avionics-glow-green font-bold">{xpdrCode}</span>
            </div>
          </button>

          {/* ALT indicator */}
          <div className="flex items-center px-2 py-1.5 border-r border-avionics-divider">
            <span className={`text-[10px] font-mono font-bold ${xpdrMode === "ALT" ? "text-avionics-green" : "text-avionics-label"}`}>
              {xpdrMode}<sup className="text-[7px]">R</sup>
            </span>
          </div>

          {/* NAV Frequencies */}
          <div className="flex items-center px-2 py-1.5">
            <div className="flex flex-col mr-1">
              <span className="text-[9px] text-avionics-label">NAV</span>
              <span className="text-[8px] text-avionics-label">STBY</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-sm text-avionics-green avionics-glow-green font-bold leading-none">{nav.activeFreq}</span>
              <span className="font-mono text-xs text-avionics-cyan leading-none">{nav.standbyFreq}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
