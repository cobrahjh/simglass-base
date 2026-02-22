import { RotateCcw, Menu, Circle, Compass, ZoomIn, ZoomOut, Home } from "lucide-react";
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

  return (
    <div className="bg-avionics-panel">
      {/* Nav mode indicators */}
      <div className="flex items-center border-b border-avionics-divider">
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
    </div>
  );
};
