import { useFlightData } from "../FlightDataContext";
import { Fuel, Clock, Gauge, Droplets } from "lucide-react";

const FuelBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isLow = pct < 20;
  const isCritical = pct < 10;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-avionics-label font-mono uppercase">{label}</span>
        <span className={`font-mono text-xs ${isCritical ? "text-destructive avionics-glow-amber" : isLow ? "text-avionics-amber" : "text-avionics-green"}`}>
          {Math.round(value)} <span className="text-[8px] text-avionics-label">LBS</span>
        </span>
      </div>
      <div className="h-3 w-full rounded-sm bg-avionics-inset avionics-inset-shadow overflow-hidden border border-avionics-divider">
        <div
          className={`h-full transition-all duration-500 rounded-sm ${
            isCritical ? "bg-destructive" : isLow ? "bg-avionics-amber" : color
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const DataRow = ({ label, value, unit, highlight }: { label: string; value: string | number; unit?: string; highlight?: string }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-avionics-divider/50">
    <span className="text-[9px] text-avionics-label font-mono uppercase">{label}</span>
    <div className="flex items-center gap-1">
      <span className={`font-mono text-sm ${highlight || "text-avionics-white"}`}>{value}</span>
      {unit && <span className="text-[8px] text-avionics-label">{unit}</span>}
    </div>
  </div>
);

export const FuelScreen = () => {
  const { fuel, navigation, flight, connectionMode } = useFlightData();

  const pctRemaining = fuel.max > 0 ? Math.round((fuel.current / fuel.max) * 100) : 0;
  const isLow = pctRemaining < 20;
  const isCritical = pctRemaining < 10;

  // Estimate range from endurance and ground speed
  const enduranceParts = fuel.endurance.split(":");
  const enduranceHrs = enduranceParts.length === 2 ? parseInt(enduranceParts[0]) + parseInt(enduranceParts[1]) / 60 : 0;
  const estimatedRange = flight.groundSpeed > 0 ? Math.round(enduranceHrs * flight.groundSpeed) : 0;

  // Fuel to destination
  const etaToDestHrs = flight.groundSpeed > 0 && navigation.distanceRemaining > 0
    ? navigation.distanceRemaining / flight.groundSpeed
    : 0;
  const fuelToDest = Math.round(etaToDestHrs * fuel.flow);
  const fuelAtDest = Math.max(0, fuel.current - fuelToDest);
  const reserveOk = fuelAtDest > fuel.flow * 0.75; // 45-min reserve

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-avionics-divider bg-avionics-panel">
        <div className="flex items-center gap-1.5">
          <Fuel className="w-3.5 h-3.5 text-avionics-cyan" />
          <span className="font-mono text-[10px] text-avionics-cyan tracking-wider">FUEL STATUS</span>
        </div>
        <span className={`font-mono text-[10px] ${
          connectionMode === "none" ? "text-avionics-label" : "text-avionics-green"
        }`}>
          {connectionMode === "none" ? "NO DATA" : connectionMode.toUpperCase()}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* Main gauge - circular-style readout */}
        <div className="bg-avionics-panel rounded-lg border border-avionics-divider p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-avionics-label font-mono">TOTAL FUEL</span>
            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
              isCritical ? "bg-destructive/20 text-destructive" : isLow ? "bg-avionics-amber/20 text-avionics-amber" : "bg-avionics-green/10 text-avionics-green"
            }`}>
              {pctRemaining}%
            </span>
          </div>

          {/* Large fuel readout */}
          <div className="flex items-end justify-center gap-1 mb-3">
            <span className={`font-mono text-3xl leading-none ${
              isCritical ? "text-destructive" : isLow ? "text-avionics-amber avionics-glow-amber" : "text-avionics-green avionics-glow-green"
            }`}>
              {fuel.current.toLocaleString()}
            </span>
            <span className="text-[10px] text-avionics-label font-mono pb-0.5">/ {fuel.max.toLocaleString()} LBS</span>
          </div>

          {/* Main progress bar */}
          <FuelBar label="Total" value={fuel.current} max={fuel.max} color="bg-avionics-green" />

          {/* Simulated tank split (L/R) */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <FuelBar label="L Tank" value={fuel.current * 0.52} max={fuel.max / 2} color="bg-avionics-cyan" />
            <FuelBar label="R Tank" value={fuel.current * 0.48} max={fuel.max / 2} color="bg-avionics-cyan" />
          </div>
        </div>

        {/* Flow & Endurance */}
        <div className="bg-avionics-panel rounded-lg border border-avionics-divider p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Gauge className="w-3 h-3 text-avionics-amber" />
            <span className="text-[9px] text-avionics-label font-mono">ENGINE DATA</span>
          </div>
          <DataRow label="Fuel Flow" value={fuel.flow} unit="PPH" highlight="text-avionics-amber" />
          <DataRow label="Flow / Min" value={fuel.flow > 0 ? (fuel.flow / 60).toFixed(1) : "0"} unit="LBS/MIN" />
        </div>

        {/* Endurance & Range */}
        <div className="bg-avionics-panel rounded-lg border border-avionics-divider p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3 h-3 text-avionics-cyan" />
            <span className="text-[9px] text-avionics-label font-mono">ENDURANCE</span>
          </div>
          <DataRow label="Time Remaining" value={fuel.endurance} highlight="text-avionics-cyan" />
          <DataRow label="Est. Range" value={estimatedRange} unit="NM" highlight="text-avionics-green" />
        </div>

        {/* Destination fuel planning */}
        {navigation.distanceRemaining > 0 && fuel.flow > 0 && (
          <div className="bg-avionics-panel rounded-lg border border-avionics-divider p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Droplets className="w-3 h-3 text-avionics-magenta" />
              <span className="text-[9px] text-avionics-label font-mono">DEST PLANNING</span>
            </div>
            <DataRow label="Fuel to Dest" value={fuelToDest.toLocaleString()} unit="LBS" highlight="text-avionics-magenta" />
            <DataRow
              label="Fuel at Dest"
              value={fuelAtDest.toLocaleString()}
              unit="LBS"
              highlight={reserveOk ? "text-avionics-green" : "text-destructive"}
            />
            <DataRow
              label="Reserve"
              value={reserveOk ? "OK" : "LOW"}
              highlight={reserveOk ? "text-avionics-green" : "text-destructive"}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end px-3 py-1 border-t border-avionics-divider">
        <span className="font-mono text-[10px] text-avionics-cyan">FUEL</span>
      </div>
    </div>
  );
};
