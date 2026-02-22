import { useState, useEffect, useRef } from "react";
import { useFlightData, ConnectionMode } from "../FlightDataContext";
import { Wifi, WifiOff, TestTube2 } from "lucide-react";

type Tab = "conn" | "setup" | "gps" | "units" | "database" | "backlight";

const TabButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-[10px] font-mono transition-colors border-b-2 ${
      active ? "text-avionics-cyan border-avionics-cyan" : "text-avionics-label border-transparent hover:text-avionics-white"
    }`}
  >
    {label}
  </button>
);

const SettingRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div className="flex items-center justify-between py-2 px-3 border-b border-avionics-divider/50">
    <span className="text-[10px] text-avionics-white">{label}</span>
    <span className={`text-[10px] font-mono ${color || "text-avionics-cyan"}`}>{value}</span>
  </div>
);

// Satellite data
interface SatInfo {
  prn: number;
  elev: number;
  azim: number;
  snr: number;
  used: boolean;
}

const generateSatellites = (): SatInfo[] => [
  { prn: 2, elev: 45, azim: 120, snr: 42, used: true },
  { prn: 5, elev: 68, azim: 210, snr: 47, used: true },
  { prn: 7, elev: 22, azim: 45, snr: 35, used: true },
  { prn: 10, elev: 55, azim: 315, snr: 44, used: true },
  { prn: 13, elev: 30, azim: 170, snr: 38, used: true },
  { prn: 15, elev: 72, azim: 88, snr: 48, used: true },
  { prn: 17, elev: 15, azim: 260, snr: 28, used: true },
  { prn: 20, elev: 40, azim: 340, snr: 40, used: true },
  { prn: 23, elev: 8, azim: 195, snr: 18, used: false },
  { prn: 25, elev: 60, azim: 150, snr: 45, used: true },
  { prn: 28, elev: 5, azim: 70, snr: 12, used: false },
  { prn: 31, elev: 35, azim: 290, snr: 36, used: true },
];

const SkyView = ({ satellites }: { satellites: SatInfo[] }) => {
  const r = 52;
  const cx = 60;
  const cy = 60;

  return (
    <div className="flex items-center justify-center py-2">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Sky circles */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(220 15% 25%)" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={r * 0.66} fill="none" stroke="hsl(220 15% 20%)" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={r * 0.33} fill="none" stroke="hsl(220 15% 20%)" strokeWidth="0.5" />
        {/* Crosshairs */}
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="hsl(220 15% 20%)" strokeWidth="0.5" />
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="hsl(220 15% 20%)" strokeWidth="0.5" />
        {/* Labels */}
        <text x={cx} y={cy - r - 3} textAnchor="middle" fill="hsl(0 0% 92%)" fontSize="6" fontFamily="'Share Tech Mono'">N</text>
        <text x={cx} y={cy + r + 8} textAnchor="middle" fill="hsl(0 0% 92%)" fontSize="6" fontFamily="'Share Tech Mono'">S</text>
        <text x={cx - r - 5} y={cy + 2} textAnchor="middle" fill="hsl(0 0% 92%)" fontSize="6" fontFamily="'Share Tech Mono'">W</text>
        <text x={cx + r + 5} y={cy + 2} textAnchor="middle" fill="hsl(0 0% 92%)" fontSize="6" fontFamily="'Share Tech Mono'">E</text>
        {/* Satellites */}
        {satellites.map((sat) => {
          const dist = ((90 - sat.elev) / 90) * r;
          const rad = ((sat.azim - 90) * Math.PI) / 180;
          const sx = cx + dist * Math.cos(rad);
          const sy = cy + dist * Math.sin(rad);
          return (
            <g key={sat.prn}>
              <rect
                x={sx - 4}
                y={sy - 4}
                width={8}
                height={8}
                rx={1}
                fill={sat.used ? "hsl(160 100% 45%)" : "hsl(220 15% 35%)"}
                opacity={sat.used ? 0.9 : 0.5}
              />
              <text x={sx} y={sy + 2.5} textAnchor="middle" fill="hsl(220 20% 8%)" fontSize="5" fontWeight="bold" fontFamily="'Share Tech Mono'">
                {sat.prn}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const SnrBars = ({ satellites }: { satellites: SatInfo[] }) => (
  <div className="px-3 py-1">
    <div className="flex items-end gap-[3px] h-12">
      {satellites.map((sat) => (
        <div key={sat.prn} className="flex flex-col items-center gap-0.5 flex-1">
          <div
            className="w-full rounded-t"
            style={{
              height: `${(sat.snr / 50) * 100}%`,
              backgroundColor: sat.snr > 35
                ? "hsl(160 100% 45%)"
                : sat.snr > 20
                ? "hsl(40 100% 55%)"
                : "hsl(0 84% 60%)",
            }}
          />
          <span className="text-[6px] font-mono text-avionics-label">{sat.prn}</span>
        </div>
      ))}
    </div>
  </div>
);

const GpsTab = () => {
  const sats = generateSatellites();
  const usedCount = sats.filter((s) => s.used).length;
  const [hpl, setHpl] = useState(8.2);
  const [vpl, setVpl] = useState(12.5);
  const timeRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      timeRef.current += 0.1;
      const t = timeRef.current;
      setHpl(parseFloat((8.2 + Math.sin(t * 0.3) * 1.5).toFixed(1)));
      setVpl(parseFloat((12.5 + Math.sin(t * 0.4) * 2.0).toFixed(1)));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* Status header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-avionics-divider">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-avionics-green animate-pulse" />
          <span className="font-mono text-[10px] text-avionics-green">3D FIX</span>
        </div>
        <span className="font-mono text-[10px] text-avionics-white">
          {usedCount}/{sats.length} SVs
        </span>
      </div>

      {/* Sky view + SNR */}
      <SkyView satellites={sats} />
      <SnrBars satellites={sats} />

      {/* Accuracy */}
      <div className="border-t border-avionics-divider">
        <SettingRow label="HPL" value={`${hpl} m`} color="text-avionics-green" />
        <SettingRow label="VPL" value={`${vpl} m`} color="text-avionics-green" />
        <SettingRow label="SBAS" value="WAAS — Active" color="text-avionics-green" />
        <SettingRow label="RAIM" value="Available" color="text-avionics-green" />
        <SettingRow label="GPS Phase" value="ENR" />
      </div>
    </div>
  );
};

const DatabaseTab = () => (
  <div>
    <div className="px-3 py-1.5 border-b border-avionics-divider">
      <span className="font-mono text-[9px] text-avionics-amber">NAVIGATION DATABASE</span>
    </div>
    <SettingRow label="Nav Data" value="Current" color="text-avionics-green" />
    <SettingRow label="Cycle" value="AIRAC 2602" />
    <SettingRow label="Effective" value="20 FEB 2026" />
    <SettingRow label="Expires" value="20 MAR 2026" />
    <SettingRow label="Provider" value="Jeppesen" />

    <div className="px-3 py-1.5 border-b border-avionics-divider mt-1">
      <span className="font-mono text-[9px] text-avionics-amber">TERRAIN / OBSTACLE</span>
    </div>
    <SettingRow label="Terrain DB" value="Current" color="text-avionics-green" />
    <SettingRow label="Version" value="v4.02" />
    <SettingRow label="Coverage" value="Americas" />

    <div className="px-3 py-1.5 border-b border-avionics-divider mt-1">
      <span className="font-mono text-[9px] text-avionics-amber">SOFTWARE</span>
    </div>
    <SettingRow label="System SW" value="v8.12" />
    <SettingRow label="GPS SW" value="v5.40" />
    <SettingRow label="Boot Code" value="v2.08" />
    <SettingRow label="Serial No." value="2AG-012847" />
  </div>
);

const UnitsTab = () => (
  <div>
    <SettingRow label="Altitude / Vertical" value="Feet (ft / fpm)" />
    <SettingRow label="Distance / Speed" value="NM / kt" />
    <SettingRow label="Fuel" value="Gallons" />
    <SettingRow label="NAV Angle" value="Magnetic (°)" />
    <SettingRow label="Position Format" value="DD°MM.M'" />
    <SettingRow label="Pressure" value="in Hg" />
    <SettingRow label="Temperature" value="°C" />
    <SettingRow label="Wind Speed" value="Knots" />
    <SettingRow label="Runway Length" value="Feet" />
  </div>
);

const ConnectionTab = () => {
  const { connectionMode, testMode, setTestMode, wsUrl, setWsUrl, connectWebSocket, disconnectWebSocket, flight, fuel, navigation } = useFlightData();

  const statusColor: Record<ConnectionMode, string> = {
    none: "text-avionics-label",
    test: "text-avionics-amber",
    flowpro: "text-avionics-green",
    websocket: "text-avionics-cyan",
  };

  const statusLabel: Record<ConnectionMode, string> = {
    none: "AWAITING SIM",
    test: "TEST MODE",
    flowpro: "FLOW PRO",
    websocket: "WS BRIDGE",
  };

  const StatusIcon = connectionMode === "none" ? WifiOff : connectionMode === "test" ? TestTube2 : Wifi;

  return (
    <div>
      {/* Connection status */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-avionics-divider">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 ${statusColor[connectionMode]}`} />
          <span className={`font-mono text-[11px] font-bold ${statusColor[connectionMode]}`}>
            {statusLabel[connectionMode]}
          </span>
        </div>
        <div className={`w-2 h-2 rounded-full ${connectionMode !== "none" ? "bg-avionics-green animate-pulse" : "bg-avionics-divider"}`} />
      </div>

      {/* Test mode toggle */}
      <button
        onClick={() => setTestMode(!testMode)}
        className={`w-full flex items-center justify-between px-3 py-2.5 border-b border-avionics-divider/50 transition-colors ${
          testMode ? "bg-avionics-amber/10" : "hover:bg-avionics-button-hover"
        }`}
      >
        <span className="text-[10px] text-avionics-white">Test Mode (Simulated Data)</span>
        <span className={`font-mono text-[10px] font-bold ${testMode ? "text-avionics-amber" : "text-avionics-label"}`}>
          {testMode ? "ON" : "OFF"}
        </span>
      </button>

      {/* WebSocket bridge */}
      <div className="px-3 py-2.5 border-b border-avionics-divider/50">
        <span className="text-[9px] text-avionics-label mb-1.5 block">WEBSOCKET BRIDGE</span>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            disabled={testMode}
            className="flex-1 bg-avionics-inset text-avionics-white font-mono text-[10px] px-2 py-1.5 rounded border border-avionics-divider focus:border-avionics-cyan focus:outline-none disabled:opacity-40"
          />
          {connectionMode === "websocket" ? (
            <button onClick={disconnectWebSocket} className="px-2 py-1.5 text-[9px] font-mono text-destructive bg-destructive/10 rounded border border-destructive/30 hover:bg-destructive/20">
              DISC
            </button>
          ) : (
            <button onClick={connectWebSocket} disabled={testMode} className="px-2 py-1.5 text-[9px] font-mono text-avionics-cyan bg-avionics-button rounded border border-avionics-divider hover:bg-avionics-button-hover disabled:opacity-40">
              CONN
            </button>
          )}
        </div>
      </div>

      {/* Live data readout */}
      {connectionMode !== "none" && (
        <>
          <div className="px-3 py-1.5 border-b border-avionics-divider">
            <span className="font-mono text-[9px] text-avionics-amber">LIVE DATA</span>
          </div>
          <SettingRow label="Altitude" value={`${flight.altitude.toLocaleString()} ft`} color="text-avionics-green" />
          <SettingRow label="Ground Speed" value={`${flight.groundSpeed} kt`} color="text-avionics-green" />
          <SettingRow label="Heading" value={`${flight.heading.toString().padStart(3, "0")}°`} />
          <SettingRow label="Position" value={`${flight.lat.toFixed(4)} / ${flight.lng.toFixed(4)}`} />
          <SettingRow label="Fuel" value={`${fuel.current.toLocaleString()} lbs (${fuel.endurance})`} color={fuel.current > 0 ? "text-avionics-green" : "text-avionics-label"} />
          <SettingRow label="Next WPT" value={`${navigation.nextWaypoint} — ${navigation.distanceToNext} NM`} />
          <SettingRow label="ETA" value={navigation.eta} color="text-avionics-cyan" />
        </>
      )}
    </div>
  );
};

export const SystemScreen = () => {
  const [activeTab, setActiveTab] = useState<Tab>("conn");

  const tabLabels: Record<Tab, string> = {
    conn: "Conn",
    setup: "Setup",
    gps: "GPS",
    units: "Units",
    database: "Data",
    backlight: "Display",
  };

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      <div className="flex items-center px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white">SYSTEM</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-avionics-panel border-b border-avionics-divider overflow-x-auto">
        {(Object.keys(tabLabels) as Tab[]).map((tab) => (
          <TabButton key={tab} label={tabLabels[tab]} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "conn" && <ConnectionTab />}
        {activeTab === "setup" && (
          <div>
            <SettingRow label="CDI Scale" value="Auto" />
            <SettingRow label="Nearest Apt Runway" value="Hard Only" />
            <SettingRow label="Time Format" value="Local 24hr" />
            <SettingRow label="Keyboard Type" value="ABC" />
            <SettingRow label="FPL Import" value="Enabled" />
            <SettingRow label="Crossfill" value="On" />
            <SettingRow label="Speed Constraints" value="Enabled" />
          </div>
        )}
        {activeTab === "gps" && <GpsTab />}
        {activeTab === "units" && <UnitsTab />}
        {activeTab === "database" && <DatabaseTab />}
        {activeTab === "backlight" && (
          <div className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-avionics-white">Backlight Level</span>
                <span className="font-mono text-xs text-avionics-green">100%</span>
              </div>
              <div className="w-full h-2 bg-avionics-inset rounded-full overflow-hidden">
                <div className="h-full bg-avionics-green rounded-full" style={{ width: "100%" }} />
              </div>
              <SettingRow label="Auto Brightness" value="On" color="text-avionics-green" />
              <SettingRow label="Manual Offset" value="+0.0%" />
              <SettingRow label="Night Mode" value="Off" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
