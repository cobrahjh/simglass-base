import simglassLogo from "@/assets/simglass-logo.png";
import { GtnProvider, useGtn } from "@/components/avionics/GtnContext";
import { FlightDataProvider } from "@/components/avionics/FlightDataContext";
import { TopBar } from "@/components/avionics/TopBar";
import { NavInfoStrip } from "@/components/avionics/NavInfoStrip";
import { MapDisplay } from "@/components/avionics/MapDisplay";
import { FlightPlanStrip } from "@/components/avionics/FlightPlanStrip";
import { BottomToolbar } from "@/components/avionics/BottomToolbar";
import { ComPanel } from "@/components/avionics/ComPanel";
import { AudioPanel } from "@/components/avionics/AudioPanel";
import { XpdrPanel } from "@/components/avionics/XpdrPanel";
import { HomeScreen } from "@/components/avionics/screens/HomeScreen";
import { TrafficScreen } from "@/components/avionics/screens/TrafficScreen";
import { TerrainScreen } from "@/components/avionics/screens/TerrainScreen";
import { WeatherScreen } from "@/components/avionics/screens/WeatherScreen";
import { WeatherDetailScreen } from "@/components/avionics/screens/WeatherDetailScreen";
import { SystemScreen } from "@/components/avionics/screens/SystemScreen";
import { UtilitiesScreen } from "@/components/avionics/screens/UtilitiesScreen";
import { FlightPlanScreen } from "@/components/avionics/screens/FlightPlanScreen";
import { ProceduresScreen } from "@/components/avionics/screens/ProceduresScreen";
import { DirectToScreen } from "@/components/avionics/screens/DirectToScreen";
import { EmergencyScreen } from "@/components/avionics/screens/EmergencyScreen";
import { NearestScreen } from "@/components/avionics/screens/NearestScreen";
import { ChartsScreen } from "@/components/avionics/screens/ChartsScreen";
import { WaypointScreen } from "@/components/avionics/screens/WaypointScreen";
import { ServicesScreen } from "@/components/avionics/screens/ServicesScreen";
import { FuelScreen } from "@/components/avionics/screens/FuelScreen";
import { PfdScreen } from "@/components/avionics/screens/PfdScreen";
import { VcalcScreen } from "@/components/avionics/screens/VcalcScreen";
import { TripPlanningScreen } from "@/components/avionics/screens/TripPlanningScreen";
import { DaltScreen } from "@/components/avionics/screens/DaltScreen";
import { ChecklistsScreen } from "@/components/avionics/screens/ChecklistsScreen";
import { SafeTaxiScreen } from "@/components/avionics/screens/SafeTaxiScreen";
import { PlaceholderScreen } from "@/components/avionics/screens/PlaceholderScreen";
import { CdiBar } from "@/components/avionics/CdiBar";
import { useState } from "react";
import { Home, Navigation, ChevronUp, ChevronDown } from "lucide-react";

const GtnDisplay = () => {
  const { currentPage, comPanelOpen, audioPanelOpen, xpdrPanelOpen, navigateTo, smartGlideActive, directToTarget } = useGtn();
  const [tabsCollapsed, setTabsCollapsed] = useState(false);

  const renderScreen = () => {
    switch (currentPage) {
      case "map":
        return (
          <>
            <NavInfoStrip />
            <MapDisplay />
            <FlightPlanStrip />
          </>
        );
      case "home":
        return <HomeScreen />;
      case "traffic":
        return <TrafficScreen />;
      case "terrain":
        return <TerrainScreen />;
      case "weather":
        return <WeatherDetailScreen />;
      case "system":
        return <SystemScreen />;
      case "utilities":
        return <UtilitiesScreen />;
      case "flightplan":
        return <FlightPlanScreen />;
      case "proc":
        return <ProceduresScreen />;
      case "directto":
        return <DirectToScreen />;
      case "emergency":
        return <EmergencyScreen />;
      case "nearest":
        return <NearestScreen />;
      case "charts":
        return <ChartsScreen />;
      case "waypoint":
        return <WaypointScreen />;
      case "services":
        return <ServicesScreen />;
      case "fuel":
        return <FuelScreen />;
      case "pfd":
        return <PfdScreen />;
      case "vcalc":
        return <VcalcScreen />;
      case "trip":
        return <TripPlanningScreen />;
      case "dalt":
        return <DaltScreen />;
      case "checklists":
        return <ChecklistsScreen />;
      case "safetaxi":
        return <SafeTaxiScreen />;
      default:
        return <PlaceholderScreen page={currentPage} />;
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl overflow-hidden border-2 border-avionics-divider bg-avionics-panel-dark flex flex-col" style={{ height: "min(85vh, 680px)" }}>
      {/* Header */}
      <div className={`border-b border-avionics-divider px-3 py-1 flex items-center justify-between ${smartGlideActive ? "bg-destructive/20" : "bg-avionics-panel"}`}>
        <span className="font-body text-[13px] text-avionics-label tracking-[0.3em] uppercase font-semibold">
          {smartGlideActive ? "⚠ EMERGENCY" : "SIMGLASS AVIONICS"}
        </span>
        <div className="flex items-center gap-2">
          {directToTarget && (
            <span className="font-mono text-[9px] text-avionics-magenta">D→ {directToTarget}</span>
          )}
          <button
            onClick={() => navigateTo("directto")}
            className="flex items-center gap-0.5 hover:opacity-80 transition-opacity"
          >
            <Navigation className="w-3 h-3 text-avionics-magenta" />
            <span className="text-[9px] text-avionics-magenta font-mono">DIRECT</span>
          </button>
          <button
            onClick={() => navigateTo("home")}
            className="flex items-center gap-0.5 hover:opacity-80 transition-opacity"
          >
            <Home className="w-3 h-3 text-avionics-cyan" />
            <span className="text-[9px] text-avionics-cyan font-mono">HOME</span>
          </button>
        </div>
      </div>

      {/* Page locator bar */}
      <div className="flex items-center bg-avionics-panel-dark border-b border-avionics-divider">
        {/* Collapse toggle */}
        <button
          onClick={() => setTabsCollapsed(c => !c)}
          className="px-1 py-1 flex items-center justify-center hover:bg-avionics-button-hover transition-colors border-r border-avionics-divider shrink-0"
          title={tabsCollapsed ? "Expand tabs" : "Collapse tabs"}
        >
          {tabsCollapsed
            ? <ChevronDown className="w-3.5 h-3.5 text-avionics-cyan" />
            : <ChevronUp className="w-3.5 h-3.5 text-avionics-cyan" />
          }
        </button>

        {tabsCollapsed ? (
          /* Collapsed: show only active page label */
          <span className="px-2 py-[3px] text-[8px] font-mono text-avionics-cyan">
            {currentPage.toUpperCase()}
          </span>
        ) : (
          /* Expanded: two rows of tabs, most-used first */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Row 1: Most used */}
            <div className="flex items-center w-full">
              {([
                { label: "NAV MAP", page: "map" as const },
                { label: "FPL", page: "flightplan" as const },
                { label: "PFD", page: "pfd" as const },
                { label: "WX", page: "weather" as const },
                { label: "CHRT", page: "charts" as const },
                { label: "TAXI", page: "safetaxi" as const },
                { label: "PROC", page: "proc" as const },
                { label: "NRST", page: "nearest" as const },
              ]).map((tab) => (
                <button
                  key={tab.page}
                  onClick={() => navigateTo(tab.page)}
                  className={`flex-1 py-1.5 text-[12px] font-mono whitespace-nowrap transition-colors text-center ${
                    currentPage === tab.page
                      ? "text-avionics-cyan bg-avionics-button border-b-2 border-avionics-cyan"
                      : "text-avionics-label hover:text-avionics-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Row 2: Secondary */}
            <div className="flex items-center w-full border-t border-avionics-divider/30">
              {([
                { label: "TRFC", page: "traffic" as const },
                { label: "TERR", page: "terrain" as const },
                { label: "WPT", page: "waypoint" as const },
                { label: "FUEL", page: "fuel" as const },
                { label: "VCALC", page: "vcalc" as const },
                { label: "TRIP", page: "trip" as const },
                { label: "DALT", page: "dalt" as const },
                { label: "CHKL", page: "checklists" as const },
                { label: "SVC", page: "services" as const },
              ]).map((tab) => (
                <button
                  key={tab.page}
                  onClick={() => navigateTo(tab.page)}
                  className={`flex-1 py-1.5 text-[12px] font-mono whitespace-nowrap transition-colors text-center ${
                    currentPage === tab.page
                      ? "text-avionics-cyan bg-avionics-button border-b-2 border-avionics-cyan"
                      : "text-avionics-label hover:text-avionics-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top frequency bar */}
      <TopBar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {renderScreen()}
        {currentPage === "map" && <CdiBar />}
        {comPanelOpen && <ComPanel />}
        {audioPanelOpen && <AudioPanel />}
        {xpdrPanelOpen && <XpdrPanel />}
      </div>

      {/* Bottom toolbar */}
      <BottomToolbar />
    </div>
  );
};

const Index = () => {
  return (
    <GtnProvider>
      <FlightDataProvider>
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <GtnDisplay />
        </div>
      </FlightDataProvider>
    </GtnProvider>
  );
};

export default Index;
