import { useGtn, GtnPage } from "../GtnContext";
import { Map, Radio, Mountain, CloudRain, FileText, Route, ListChecks, Navigation, MapPin, Wrench, Settings, AlertTriangle, Fuel, Gauge, TrendingDown, Thermometer, CheckSquare, PlaneTakeoff } from "lucide-react";

interface AppIconProps {
  icon: React.ReactNode;
  label: string;
  page: GtnPage;
  color?: string;
}

const AppIcon = ({ icon, label, page, color }: AppIconProps) => {
  const { navigateTo } = useGtn();
  return (
    <button
      onClick={() => navigateTo(page)}
      className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg hover:bg-avionics-button-hover active:bg-avionics-button-active transition-colors"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color || "bg-avionics-button"}`}>
        {icon}
      </div>
      <span className="text-[10px] text-avionics-white font-medium leading-tight text-center">{label}</span>
    </button>
  );
};

export const HomeScreen = () => {
  const { com, nav } = useGtn();

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      {/* Top info strip */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-avionics-divider bg-avionics-panel">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-avionics-label">DIS</span>
            <span className="font-mono text-xs text-avionics-white">0</span>
            <span className="text-[8px] text-avionics-label">KT</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-avionics-label">DTK</span>
            <span className="font-mono text-xs text-avionics-magenta">347°</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-avionics-white">5500</span>
          <span className="text-[8px] text-avionics-label">FT</span>
        </div>
      </div>

      {/* App icon grid */}
      <div className="flex-1 grid grid-cols-4 gap-1 p-3 content-start overflow-y-auto">
        <AppIcon
          icon={<Gauge className="w-5 h-5 text-avionics-green" />}
          label="PFD"
          page="pfd"
          color="bg-[hsl(160_30%_18%)]"
        />
        <AppIcon
          icon={<Map className="w-5 h-5 text-avionics-cyan" />}
          label="Map"
          page="map"
          color="bg-[hsl(200_40%_20%)]"
        />
        <AppIcon
          icon={<Radio className="w-5 h-5 text-avionics-cyan" />}
          label="Traffic"
          page="traffic"
          color="bg-[hsl(200_40%_20%)]"
        />
        <AppIcon
          icon={<Mountain className="w-5 h-5 text-avionics-amber" />}
          label="Terrain"
          page="terrain"
          color="bg-[hsl(35_40%_20%)]"
        />
        <AppIcon
          icon={<CloudRain className="w-5 h-5 text-avionics-green" />}
          label="Weather"
          page="weather"
          color="bg-[hsl(160_40%_15%)]"
        />
        <AppIcon
          icon={<FileText className="w-5 h-5 text-avionics-white" />}
          label="Charts"
          page="charts"
          color="bg-avionics-button"
        />
        <AppIcon
          icon={<Route className="w-5 h-5 text-avionics-magenta" />}
          label="Flight Plan"
          page="flightplan"
          color="bg-[hsl(300_30%_20%)]"
        />
        <AppIcon
          icon={<ListChecks className="w-5 h-5 text-avionics-white" />}
          label="PROC"
          page="proc"
          color="bg-avionics-button"
        />
        <AppIcon
          icon={<Navigation className="w-5 h-5 text-avionics-cyan" />}
          label="Nearest"
          page="nearest"
          color="bg-[hsl(200_40%_20%)]"
        />
        <AppIcon
          icon={<MapPin className="w-5 h-5 text-avionics-cyan" />}
          label="Waypoint"
          page="waypoint"
          color="bg-[hsl(200_40%_20%)]"
        />
        <AppIcon
          icon={<Wrench className="w-5 h-5 text-avionics-white" />}
          label="Services"
          page="services"
          color="bg-avionics-button"
        />
        <AppIcon
          icon={<Settings className="w-5 h-5 text-avionics-white" />}
          label="Utilities"
          page="utilities"
          color="bg-avionics-button"
        />
        <AppIcon
          icon={<TrendingDown className="w-5 h-5 text-avionics-cyan" />}
          label="VCALC"
          page="vcalc"
          color="bg-[hsl(200_40%_20%)]"
        />
        <AppIcon
          icon={<Route className="w-5 h-5 text-avionics-magenta" />}
          label="Trip"
          page="trip"
          color="bg-[hsl(300_30%_20%)]"
        />
        <AppIcon
          icon={<Thermometer className="w-5 h-5 text-avionics-cyan" />}
          label="DALT"
          page="dalt"
          color="bg-[hsl(200_40%_20%)]"
        />
        <AppIcon
          icon={<CheckSquare className="w-5 h-5 text-avionics-green" />}
          label="Checklists"
          page="checklists"
          color="bg-[hsl(160_30%_18%)]"
        />
        <AppIcon
          icon={<PlaneTakeoff className="w-5 h-5 text-avionics-amber" />}
          label="SafeTaxi"
          page="safetaxi"
          color="bg-[hsl(35_40%_20%)]"
        />
        <AppIcon
          icon={<Settings className="w-5 h-5 text-avionics-white" />}
          label="System"
          page="system"
          color="bg-avionics-button"
        />
        <AppIcon
          icon={<Fuel className="w-5 h-5 text-avionics-amber" />}
          label="Fuel"
          page="fuel"
          color="bg-[hsl(35_40%_20%)]"
        />
        <AppIcon
          icon={<AlertTriangle className="w-5 h-5 text-avionics-amber" />}
          label="Emergency"
          page="emergency"
          color="bg-[hsl(0_40%_20%)]"
        />
      </div>

      {/* HOME label */}
      <div className="flex items-center justify-end px-3 py-1 border-t border-avionics-divider">
        <span className="font-mono text-[10px] text-avionics-cyan">HOME</span>
      </div>
    </div>
  );
};
