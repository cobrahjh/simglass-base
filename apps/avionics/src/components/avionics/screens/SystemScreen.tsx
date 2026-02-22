import { useState, useEffect, useRef, useCallback } from "react";
import { useFlightData, ConnectionMode } from "../FlightDataContext";
import { Wifi, WifiOff, TestTube2, Check, Save, Trash2, PenLine, Plus, Sun, Moon, Download, Upload, Eye } from "lucide-react";

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

// ── Color Schemes ──────────────────────────────────────────────
interface ColorScheme {
  id: string;
  name: string;
  builtin?: boolean;
  vars: Record<string, string>;
}

const VAR_LABELS: { key: string; label: string }[] = [
  { key: "--avionics-green", label: "Primary" },
  { key: "--avionics-cyan", label: "Accent" },
  { key: "--avionics-magenta", label: "Highlight" },
  { key: "--avionics-amber", label: "Warning" },
];

const BUILTIN_SCHEMES: ColorScheme[] = [
  {
    id: "default", name: "Standard", builtin: true,
    vars: { "--avionics-green": "160 100% 45%", "--avionics-cyan": "185 100% 55%", "--avionics-magenta": "300 80% 60%", "--avionics-amber": "40 100% 55%" },
  },
  {
    id: "neon", name: "Neon", builtin: true,
    vars: { "--avionics-green": "130 100% 50%", "--avionics-cyan": "170 100% 50%", "--avionics-magenta": "320 100% 60%", "--avionics-amber": "50 100% 55%" },
  },
  {
    id: "military", name: "Military", builtin: true,
    vars: { "--avionics-green": "120 60% 40%", "--avionics-cyan": "80 50% 45%", "--avionics-magenta": "45 80% 50%", "--avionics-amber": "30 80% 45%" },
  },
  {
    id: "ocean", name: "Ocean", builtin: true,
    vars: { "--avionics-green": "175 80% 50%", "--avionics-cyan": "200 90% 50%", "--avionics-magenta": "260 70% 60%", "--avionics-amber": "35 90% 55%" },
  },
  {
    id: "sunset", name: "Sunset", builtin: true,
    vars: { "--avionics-green": "30 100% 55%", "--avionics-cyan": "350 80% 55%", "--avionics-magenta": "280 70% 55%", "--avionics-amber": "50 100% 50%" },
  },
  {
    id: "arctic", name: "Arctic", builtin: true,
    vars: { "--avionics-green": "210 60% 70%", "--avionics-cyan": "190 50% 65%", "--avionics-magenta": "240 50% 70%", "--avionics-amber": "45 70% 65%" },
  },
  {
    id: "amber-classic", name: "Amber Classic", builtin: true,
    vars: { "--avionics-green": "38 100% 50%", "--avionics-cyan": "45 90% 55%", "--avionics-magenta": "30 80% 45%", "--avionics-amber": "25 100% 50%" },
  },
  {
    id: "red-alert", name: "Red Alert", builtin: true,
    vars: { "--avionics-green": "0 85% 55%", "--avionics-cyan": "350 90% 60%", "--avionics-magenta": "330 80% 55%", "--avionics-amber": "15 100% 50%" },
  },
  {
    id: "phosphor", name: "Phosphor", builtin: true,
    vars: { "--avionics-green": "120 100% 45%", "--avionics-cyan": "115 80% 50%", "--avionics-magenta": "130 60% 55%", "--avionics-amber": "90 80% 50%" },
  },
  {
    id: "stealth", name: "Stealth", builtin: true,
    vars: { "--avionics-green": "220 15% 55%", "--avionics-cyan": "210 20% 50%", "--avionics-magenta": "230 15% 45%", "--avionics-amber": "35 30% 50%" },
  },
  {
    id: "royal", name: "Royal", builtin: true,
    vars: { "--avionics-green": "270 70% 60%", "--avionics-cyan": "245 80% 65%", "--avionics-magenta": "310 70% 55%", "--avionics-amber": "40 90% 55%" },
  },
  {
    id: "infrared", name: "Infrared", builtin: true,
    vars: { "--avionics-green": "0 70% 45%", "--avionics-cyan": "20 80% 50%", "--avionics-magenta": "340 70% 50%", "--avionics-amber": "35 90% 50%" },
  },
];

function parseHsl(hslStr: string): [number, number, number] {
  const parts = hslStr.split(/\s+/);
  return [
    parseInt(parts[0]) || 0,
    parseInt(parts[1]) || 100,
    parseInt(parts[2]) || 50,
  ];
}

function toHslStr(h: number, s: number, l: number) {
  return `${h} ${s}% ${l}%`;
}

function hslToCss(hslStr: string) {
  return `hsl(${hslStr.replace(/\s+/g, ", ").replace("%, %", "% , ")})`.replace(/, (\d+)%/, ", $1%");
}

function loadUserSchemes(): ColorScheme[] {
  try {
    const raw = localStorage.getItem("avionics-user-schemes");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveUserSchemes(schemes: ColorScheme[]) {
  localStorage.setItem("avionics-user-schemes", JSON.stringify(schemes));
}

// ── HSL Slider Row ─────────────────────────────────────────────
const HslSlider = ({ label, hsl, onChange }: {
  label: string;
  hsl: [number, number, number];
  onChange: (val: [number, number, number]) => void;
}) => {
  const [h, s, l] = hsl;
  const color = `hsl(${h}, ${s}%, ${l}%)`;

  return (
    <div className="px-3 py-1.5 border-b border-avionics-divider/30">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm border border-avionics-divider" style={{ background: color }} />
          <span className="text-[9px] font-mono text-avionics-white">{label}</span>
        </div>
        <span className="text-[8px] font-mono text-avionics-label">{h}° {s}% {l}%</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[7px] font-mono text-avionics-label w-3">H</span>
          <input type="range" min={0} max={360} value={h}
            onChange={(e) => onChange([parseInt(e.target.value), s, l])}
            className="flex-1 h-1 accent-avionics-cyan cursor-pointer"
            style={{ accentColor: color }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[7px] font-mono text-avionics-label w-3">S</span>
          <input type="range" min={0} max={100} value={s}
            onChange={(e) => onChange([h, parseInt(e.target.value), l])}
            className="flex-1 h-1 cursor-pointer"
            style={{ accentColor: color }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[7px] font-mono text-avionics-label w-3">L</span>
          <input type="range" min={10} max={90} value={l}
            onChange={(e) => onChange([h, s, parseInt(e.target.value)])}
            className="flex-1 h-1 cursor-pointer"
            style={{ accentColor: color }}
          />
        </div>
      </div>
    </div>
  );
};

// ── Display Tab ────────────────────────────────────────────────
const DisplayTab = () => {
  const [userSchemes, setUserSchemes] = useState<ColorScheme[]>(loadUserSchemes);
  const allSchemes = [...BUILTIN_SCHEMES, ...userSchemes];

  const [activeSchemeId, setActiveSchemeId] = useState(() =>
    localStorage.getItem("avionics-color-scheme") || "default"
  );
  type DisplayMode = "dark" | "light" | "high-contrast";
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    const saved = localStorage.getItem("avionics-display-mode");
    if (saved === "light" || saved === "high-contrast") return saved;
    return "dark";
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [editVars, setEditVars] = useState<Record<string, string>>({});
  const [editName, setEditName] = useState("");
  const [brightness, setBrightness] = useState(100);

  // Apply display mode
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "high-contrast");
    if (displayMode === "light") root.classList.add("light");
    else if (displayMode === "high-contrast") root.classList.add("high-contrast");
    localStorage.setItem("avionics-display-mode", displayMode);
  }, [displayMode]);

  const cycleDisplayMode = () => {
    setDisplayMode((prev) => {
      if (prev === "dark") return "light";
      if (prev === "light") return "high-contrast";
      return "dark";
    });
  };

  const applyVars = useCallback((vars: Record<string, string>) => {
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
  }, []);

  const applyScheme = useCallback((schemeId: string) => {
    const scheme = allSchemes.find((s) => s.id === schemeId);
    if (!scheme) return;
    applyVars(scheme.vars);
    setActiveSchemeId(schemeId);
    localStorage.setItem("avionics-color-scheme", schemeId);
    setEditing(false);
  }, [allSchemes, applyVars]);

  useEffect(() => {
    const scheme = allSchemes.find((s) => s.id === activeSchemeId);
    if (scheme) applyVars(scheme.vars);
  }, []);

  const startEditing = (scheme?: ColorScheme) => {
    const base = scheme || allSchemes.find((s) => s.id === activeSchemeId) || BUILTIN_SCHEMES[0];
    setEditVars({ ...base.vars });
    setEditName(scheme && !scheme.builtin ? scheme.name : "Custom " + (userSchemes.length + 1));
    setEditing(true);
  };

  const handleEditVarChange = (key: string, hsl: [number, number, number]) => {
    const newVars = { ...editVars, [key]: toHslStr(...hsl) };
    setEditVars(newVars);
    applyVars(newVars); // live preview
  };

  const saveEditedScheme = () => {
    const id = "user_" + Date.now();
    const existing = userSchemes.find((s) => s.name === editName);
    let updated: ColorScheme[];
    if (existing) {
      updated = userSchemes.map((s) => s.name === editName ? { ...s, vars: { ...editVars } } : s);
    } else {
      updated = [...userSchemes, { id, name: editName, vars: { ...editVars } }];
    }
    setUserSchemes(updated);
    saveUserSchemes(updated);
    const savedId = existing?.id || id;
    setActiveSchemeId(savedId);
    localStorage.setItem("avionics-color-scheme", savedId);
    setEditing(false);
  };

  const deleteScheme = (schemeId: string) => {
    const updated = userSchemes.filter((s) => s.id !== schemeId);
    setUserSchemes(updated);
    saveUserSchemes(updated);
    if (activeSchemeId === schemeId) applyScheme("default");
  };

  const cancelEdit = () => {
    setEditing(false);
    // restore active scheme
    const scheme = allSchemes.find((s) => s.id === activeSchemeId);
    if (scheme) applyVars(scheme.vars);
  };

  const exportSchemes = () => {
    const data = { schemes: userSchemes, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "avionics-color-schemes.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSchemes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const incoming: ColorScheme[] = Array.isArray(parsed.schemes) ? parsed.schemes : Array.isArray(parsed) ? parsed : [];
        if (incoming.length === 0) return;
        // Merge: skip duplicates by name
        const existingNames = new Set(userSchemes.map((s) => s.name));
        const newSchemes = incoming
          .filter((s: any) => s.name && s.vars && !existingNames.has(s.name))
          .map((s: any) => ({ id: "user_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6), name: s.name, vars: s.vars }));
        const updated = [...userSchemes, ...newSchemes];
        setUserSchemes(updated);
        saveUserSchemes(updated);
      } catch {
        console.warn("Failed to parse color scheme JSON");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    e.target.value = "";
  };

  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between px-3 py-2 border-b border-avionics-divider bg-avionics-panel">
          <span className="font-mono text-[10px] text-avionics-amber">EDIT SCHEME</span>
          <div className="flex items-center gap-1.5">
            <button onClick={cancelEdit} className="px-2 py-1 text-[8px] font-mono text-avionics-label border border-avionics-divider rounded hover:bg-avionics-button">
              CANCEL
            </button>
            <button onClick={saveEditedScheme} className="px-2 py-1 text-[8px] font-mono text-avionics-green border border-avionics-green/40 rounded hover:bg-avionics-green/10 flex items-center gap-1">
              <Save className="w-2.5 h-2.5" /> SAVE
            </button>
          </div>
        </div>

        {/* Name input */}
        <div className="px-3 py-2 border-b border-avionics-divider/50">
          <span className="text-[8px] font-mono text-avionics-label block mb-1">SCHEME NAME</span>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            maxLength={20}
            className="w-full bg-avionics-inset text-avionics-white font-mono text-[10px] px-2 py-1.5 rounded border border-avionics-divider focus:border-avionics-cyan focus:outline-none"
          />
        </div>

        {/* Live preview bar */}
        <div className="px-3 py-2 border-b border-avionics-divider/50">
          <span className="text-[8px] font-mono text-avionics-label block mb-1">PREVIEW</span>
          <div className="flex h-6 rounded overflow-hidden border border-avionics-divider/50">
            {VAR_LABELS.map(({ key, label }) => (
              <div
                key={key}
                className="flex-1 flex items-center justify-center"
                style={{ background: `hsl(${editVars[key]})` }}
              >
                <span className="text-[6px] font-mono font-bold text-black/70">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* HSL sliders */}
        {VAR_LABELS.map(({ key, label }) => (
          <HslSlider
            key={key}
            label={label}
            hsl={parseHsl(editVars[key] || "160 100% 45%")}
            onChange={(val) => handleEditVarChange(key, val)}
          />
        ))}
      </div>
    );
  }

  // ── Selector view ──
  return (
    <div>
      {/* Backlight */}
      <div className="p-3 border-b border-avionics-divider">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-avionics-white">Backlight Level</span>
          <span className="font-mono text-xs text-avionics-green">{brightness}%</span>
        </div>
        <div className="w-full h-2 bg-avionics-inset rounded-full overflow-hidden">
          <div className="h-full bg-avionics-green rounded-full transition-all" style={{ width: `${brightness}%` }} />
        </div>
        <div className="mt-2">
          <SettingRow label="Auto Brightness" value="On" color="text-avionics-green" />
          <SettingRow label="Night Mode" value="Off" />
        </div>
      </div>

      {/* Display Mode Toggle */}
      <div className="px-3 py-2 border-b border-avionics-divider">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-avionics-amber">DISPLAY MODE</span>
          <button
            onClick={cycleDisplayMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-avionics-divider bg-avionics-button transition-all hover:bg-avionics-button-hover"
          >
            {displayMode === "dark" && (
              <>
                <Moon className="w-3 h-3 text-avionics-cyan" />
                <span className="font-mono text-[9px] text-avionics-cyan">DARK</span>
              </>
            )}
            {displayMode === "light" && (
              <>
                <Sun className="w-3 h-3 text-avionics-amber" />
                <span className="font-mono text-[9px] text-avionics-amber">LIGHT</span>
              </>
            )}
            {displayMode === "high-contrast" && (
              <>
                <Eye className="w-3 h-3 text-avionics-green" />
                <span className="font-mono text-[9px] text-avionics-green">HI-CON</span>
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          {(["dark", "light", "high-contrast"] as DisplayMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setDisplayMode(mode)}
              className={`flex-1 py-1 text-[7px] font-mono rounded border transition-all ${
                displayMode === mode
                  ? "border-avionics-cyan bg-avionics-button-active text-avionics-cyan"
                  : "border-avionics-divider/30 bg-avionics-inset text-avionics-label hover:bg-avionics-button"
              }`}
            >
              {mode === "high-contrast" ? "HI-CON" : mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Color Scheme header + New button */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-avionics-divider">
        <span className="font-mono text-[9px] text-avionics-amber">COLOR SCHEME</span>
        <button
          onClick={() => startEditing()}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono text-avionics-cyan border border-avionics-cyan/30 rounded hover:bg-avionics-cyan/10"
        >
          <Plus className="w-2.5 h-2.5" /> NEW
        </button>
      </div>

      {/* Scheme grid */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {allSchemes.map((scheme) => {
          const isActive = activeSchemeId === scheme.id;
          const primaryHsl = scheme.vars["--avionics-green"] || "160 100% 45%";
          const accentHsl = scheme.vars["--avionics-cyan"] || "185 100% 55%";
          return (
            <div key={scheme.id} className="relative">
              <button
                onClick={() => applyScheme(scheme.id)}
                className={`w-full flex flex-col items-center gap-1.5 p-2 rounded border transition-all ${
                  isActive
                    ? "border-avionics-cyan bg-avionics-button-active"
                    : "border-avionics-divider/50 bg-avionics-inset hover:border-avionics-divider hover:bg-avionics-button"
                }`}
              >
                <div className="w-full h-5 rounded-sm flex overflow-hidden" style={{ background: "hsl(220,20%,8%)" }}>
                  <div className="flex-1" style={{ background: `hsl(${primaryHsl})`, opacity: 0.85 }} />
                  <div className="flex-1" style={{ background: `hsl(${accentHsl})`, opacity: 0.85 }} />
                </div>
                <span className={`font-mono text-[9px] ${isActive ? "text-avionics-cyan" : "text-avionics-label"}`}>
                  {scheme.name}
                </span>
                {isActive && (
                  <div className="absolute top-1 right-1">
                    <Check className="w-3 h-3 text-avionics-cyan" />
                  </div>
                )}
              </button>
              {/* Edit / Delete for user schemes */}
              {!scheme.builtin && (
                <div className="absolute top-1 left-1 flex gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEditing(scheme); }}
                    className="p-0.5 rounded bg-avionics-panel/80 hover:bg-avionics-button border border-avionics-divider/50"
                    title="Edit"
                  >
                    <PenLine className="w-2.5 h-2.5 text-avionics-amber" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteScheme(scheme.id); }}
                    className="p-0.5 rounded bg-avionics-panel/80 hover:bg-destructive/20 border border-avionics-divider/50"
                    title="Delete"
                  >
                    <Trash2 className="w-2.5 h-2.5 text-destructive" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Export / Import */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-avionics-divider">
        <span className="font-mono text-[9px] text-avionics-amber">SHARE SCHEMES</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={exportSchemes}
            disabled={userSchemes.length === 0}
            className="flex items-center gap-1 px-2 py-1 text-[8px] font-mono text-avionics-cyan border border-avionics-cyan/30 rounded hover:bg-avionics-cyan/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-2.5 h-2.5" /> EXPORT
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 text-[8px] font-mono text-avionics-green border border-avionics-green/30 rounded hover:bg-avionics-green/10"
          >
            <Upload className="w-2.5 h-2.5" /> IMPORT
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={importSchemes} className="hidden" />
        </div>
      </div>
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
        {activeTab === "backlight" && <DisplayTab />}
      </div>
    </div>
  );
};
