import { useState } from "react";
import { RotateCcw, Menu, Circle, Compass, ZoomIn, ZoomOut, ChevronUp, ChevronDown } from "lucide-react";
import { useGtn } from "./GtnContext";

interface BottomButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}

const BottomButton = ({ icon, label, onClick, active }: BottomButtonProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 hover:bg-avionics-button-hover active:bg-avionics-button-active transition-colors border-r border-avionics-divider last:border-r-0 ${active ? "bg-avionics-button-active" : ""}`}
  >
    <div className="w-7 h-7 flex items-center justify-center rounded bg-avionics-button avionics-bezel">
      {icon}
    </div>
    <span className="text-[9px] text-avionics-white font-medium">{label}</span>
  </button>
);

export const BottomToolbar = () => {
  const { goBack, navigateTo, currentPage, mapZoomIn, mapZoomOut } = useGtn();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-avionics-panel">
      {collapsed ? (
        <div className="flex items-center border-t border-avionics-divider">
          <button
            onClick={() => setCollapsed(false)}
            className="shrink-0 px-1 py-1 hover:bg-avionics-button-hover transition-colors border-r border-avionics-divider"
            title="Expand toolbar"
          >
            <ChevronUp className="w-3 h-3 text-avionics-cyan" />
          </button>
          <div className="flex items-center gap-3 px-2 py-1 font-mono text-[10px]">
            <span className="text-avionics-green">LPV</span>
            <span className="text-avionics-green">GPS</span>
            <button onClick={goBack} className="text-avionics-cyan hover:opacity-80">BACK</button>
            <button onClick={mapZoomIn} className="text-avionics-cyan hover:opacity-80">+</button>
            <button onClick={mapZoomOut} className="text-avionics-cyan hover:opacity-80">−</button>
          </div>
        </div>
      ) : (
        <>
          {/* Nav mode indicators */}
          <div className="flex items-center border-b border-avionics-divider">
            <button
              onClick={() => setCollapsed(true)}
              className="shrink-0 px-1 py-0.5 hover:bg-avionics-button-hover transition-colors border-r border-avionics-divider"
              title="Collapse toolbar"
            >
              <ChevronDown className="w-3 h-3 text-avionics-cyan" />
            </button>
            <div className="flex-1 text-center py-0.5">
              <span className="font-mono text-[10px] text-avionics-green avionics-glow-green">LPV</span>
            </div>
            <div className="w-px h-3 bg-avionics-divider" />
            <div className="flex-1 text-center py-0.5">
              <span className="font-mono text-[10px] text-avionics-green avionics-glow-green">GPS</span>
            </div>
            <div className="w-px h-3 bg-avionics-divider" />
            <div className="flex-1 text-center py-0.5">
              <span className="font-mono text-[9px] text-avionics-label">Com Freq / Psh Nav</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-stretch">
            <BottomButton
              icon={<RotateCcw className="w-3.5 h-3.5 text-avionics-white" />}
              label="Back"
              onClick={goBack}
            />
            <BottomButton
              icon={<Menu className="w-3.5 h-3.5 text-avionics-white" />}
              label="Menu"
            />
            <BottomButton
              icon={<Circle className="w-3.5 h-3.5 text-avionics-cyan" />}
              label="CDI"
            />
            <BottomButton
              icon={<Compass className="w-3.5 h-3.5 text-avionics-cyan" />}
              label="OBS"
            />
            <BottomButton
              icon={<ZoomIn className="w-3.5 h-3.5 text-avionics-white" />}
              label="In"
              onClick={mapZoomIn}
            />
            <BottomButton
              icon={<ZoomOut className="w-3.5 h-3.5 text-avionics-white" />}
              label="Out"
              onClick={mapZoomOut}
            />
          </div>
        </>
      )}
    </div>
  );
};