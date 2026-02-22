import { GtnPage } from "../GtnContext";

const pageLabels: Record<string, string> = {
  charts: "Charts",
  flightplan: "Flight Plan",
  proc: "Procedures",
  nearest: "Nearest",
  waypoint: "Waypoint Info",
  services: "Services",
  utilities: "Utilities",
  system: "System Setup",
};

export const PlaceholderScreen = ({ page }: { page: GtnPage }) => {
  return (
    <div className="flex-1 flex flex-col bg-avionics-inset avionics-inset-shadow overflow-hidden">
      <div className="flex items-center px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white">{pageLabels[page] || page}</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <span className="font-mono text-sm text-avionics-label">{pageLabels[page] || page}</span>
          <br />
          <span className="font-mono text-[10px] text-avionics-divider">No Data Available</span>
        </div>
      </div>
    </div>
  );
};
