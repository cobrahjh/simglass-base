import { useGtn, FlightPlanWaypoint } from "../GtnContext";
import { useState, useMemo, useRef, useCallback } from "react";
import { Upload, Download, FileText, X, AlertTriangle, Plane } from "lucide-react";

/* ─── Flight Plan Parsers ─── */

/** Parse Garmin .fpl XML files */
function parseGarminFpl(xml: string): FlightPlanWaypoint[] | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const wpTable = doc.querySelectorAll("waypoint-table waypoint");
    if (!wpTable.length) return null;

    // Build lookup from waypoint-table
    const lookup: Record<string, { lat: number; lng: number; type: string }> = {};
    wpTable.forEach(wp => {
      const id = wp.querySelector("identifier")?.textContent?.trim() || "";
      const lat = parseFloat(wp.querySelector("lat")?.textContent || "0");
      const lng = parseFloat(wp.querySelector("lon")?.textContent || "0");
      const rawType = wp.querySelector("type")?.textContent?.trim()?.toUpperCase() || "";
      let type = "fix";
      if (rawType.includes("AIRPORT")) type = "airport";
      else if (rawType.includes("VOR")) type = "vor";
      else if (rawType.includes("NDB")) type = "ndb";
      else if (rawType.includes("USER")) type = "user";
      lookup[id] = { lat, lng, type };
    });

    // Read route points
    const routePoints = doc.querySelectorAll("route route-point");
    if (!routePoints.length) return null;

    const waypoints: FlightPlanWaypoint[] = [];
    routePoints.forEach((rp, i) => {
      const id = rp.querySelector("waypoint-identifier")?.textContent?.trim() || `WP${i}`;
      const info = lookup[id] || { lat: 0, lng: 0, type: "fix" };
      waypoints.push({
        id: String(i + 1),
        name: id,
        type: info.type as FlightPlanWaypoint["type"],
        dtk: 0,
        dis: 0,
        ete: "00:00",
        lat: info.lat,
        lng: info.lng,
      });
    });

    return computeLegs(waypoints);
  } catch {
    return null;
  }
}

/** Parse simple text: one waypoint per line as IDENT,LAT,LNG or just IDENT */
function parseTextPlan(text: string): FlightPlanWaypoint[] | null {
  const lines = text.trim().split(/\n/).map(l => l.trim()).filter(l => l && !l.startsWith("#") && !l.startsWith("//"));
  if (lines.length < 2) return null;

  const waypoints: FlightPlanWaypoint[] = [];
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(/[,\t]+/).map(p => p.trim());
    const name = parts[0].toUpperCase();
    const lat = parts.length >= 3 ? parseFloat(parts[1]) : 0;
    const lng = parts.length >= 3 ? parseFloat(parts[2]) : 0;
    const isAirport = /^[A-Z]{3,4}$/.test(name) && name.startsWith("K");
    waypoints.push({
      id: String(i + 1),
      name,
      type: isAirport ? "airport" : "fix",
      dtk: 0,
      dis: 0,
      ete: "00:00",
      lat,
      lng,
    });
  }

  return computeLegs(waypoints);
}

/** Compute DTK and DIS between sequential waypoints */
function computeLegs(waypoints: FlightPlanWaypoint[]): FlightPlanWaypoint[] {
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const cur = waypoints[i];
    if (prev.lat && prev.lng && cur.lat && cur.lng) {
      cur.dis = Math.round(distNm(prev.lat, prev.lng, cur.lat, cur.lng) * 10) / 10;
      cur.dtk = Math.round(bearingDeg(prev.lat, prev.lng, cur.lat, cur.lng));
    }
    // Estimate ETE at 120kt GS
    const eteSec = cur.dis > 0 ? (cur.dis / 120) * 3600 : 0;
    const m = Math.floor(eteSec / 60);
    const s = Math.round(eteSec % 60);
    cur.ete = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return waypoints;
}

function distNm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x = Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) - Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** SimBrief ICAO type code → our aircraft ID mapping */
const SIMBRIEF_AIRCRAFT_MAP: Record<string, string> = {
  C172: "c172", C182: "c182", C152: "c152",
  PA28: "pa28", SR22: "sr22", BE36: "be36", DA40: "da40",
  BE58: "be58", PA44: "pa44", C525: "c525",
};

interface SimBriefResult {
  plan: FlightPlanWaypoint[];
  aircraftId: string | null;
  aircraftName: string | null;
}

/** Fetch and parse SimBrief OFP */
async function fetchSimBrief(pilotId: string): Promise<SimBriefResult | null> {
  try {
    const res = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?username=${encodeURIComponent(pilotId)}&json=1`);
    if (!res.ok) return null;
    const data = await res.json();

    const navlog = data?.navlog?.fix;
    if (!Array.isArray(navlog) || navlog.length < 2) return null;

    // Extract aircraft info
    const icaoCode = (data?.aircraft?.icaocode || "").toUpperCase();
    const aircraftName = data?.aircraft?.name || null;
    const aircraftId = SIMBRIEF_AIRCRAFT_MAP[icaoCode] || null;

    const waypoints: FlightPlanWaypoint[] = navlog.map((fix: any, i: number) => {
      const ident = fix.ident || `WP${i}`;
      const lat = parseFloat(fix.pos_lat) || 0;
      const lng = parseFloat(fix.pos_long) || 0;
      const alt = parseInt(fix.altitude_feet) || 0;
      const rawType = (fix.type || "").toUpperCase();
      let type: FlightPlanWaypoint["type"] = "fix";
      if (rawType.includes("APT") || rawType === "AIRPORT") type = "airport";
      else if (rawType.includes("VOR")) type = "vor";
      else if (rawType.includes("NDB")) type = "ndb";

      return {
        id: String(i + 1),
        name: ident,
        type,
        dtk: 0,
        dis: 0,
        alt,
        ete: "00:00",
        lat,
        lng,
      };
    });

    return { plan: computeLegs(waypoints), aircraftId, aircraftName };
  } catch {
    return null;
  }
}

/* ─── Import Dialog ─── */
const ImportDialog = ({ onImport, onClose }: { onImport: (plan: FlightPlanWaypoint[], aircraftId?: string | null) => void; onClose: () => void }) => {
  const [tab, setTab] = useState<"file" | "text" | "simbrief">("simbrief");
  const [textInput, setTextInput] = useState("");
  const [simbriefId, setSimbriefId] = useState(() => localStorage.getItem("simbrief_pilot_id") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<FlightPlanWaypoint[] | null>(null);
  const [simbriefMeta, setSimbriefMeta] = useState<string | null>(null);
  const [simbriefAircraftId, setSimbriefAircraftId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      let plan: FlightPlanWaypoint[] | null = null;

      if (file.name.endsWith(".fpl") || file.name.endsWith(".xml")) {
        plan = parseGarminFpl(content);
        if (!plan) setError("Could not parse Garmin FPL file. Check format.");
      } else if (file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
        plan = parseTextPlan(content);
        if (!plan) setError("Need at least 2 waypoints, one per line.");
      } else {
        plan = parseGarminFpl(content) || parseTextPlan(content);
        if (!plan) setError("Unrecognized file format.");
      }

      if (plan) setPreview(plan);
    };
    reader.readAsText(file);
  }, []);

  const handleTextParse = () => {
    setError(null);
    const plan = parseTextPlan(textInput);
    if (plan) {
      setPreview(plan);
    } else {
      setError("Need at least 2 waypoints, one per line: IDENT,LAT,LNG");
    }
  };

  const handleSimbriefFetch = async () => {
    if (!simbriefId.trim()) {
      setError("Enter your SimBrief Pilot ID or username.");
      return;
    }
    setError(null);
    setPreview(null);
    setSimbriefMeta(null);
    setSimbriefAircraftId(null);
    setLoading(true);
    try {
      localStorage.setItem("simbrief_pilot_id", simbriefId.trim());
      const result = await fetchSimBrief(simbriefId.trim());
      if (result) {
        setPreview(result.plan);
        setSimbriefAircraftId(result.aircraftId);
        const acLabel = result.aircraftName ? ` • ${result.aircraftName}` : "";
        setSimbriefMeta(`${result.plan[0]?.name} → ${result.plan[result.plan.length - 1]?.name}${acLabel}`);
      } else {
        setError("No flight plan found. Check your Pilot ID and ensure you have a recent OFP generated.");
      }
    } catch {
      setError("Failed to connect to SimBrief.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (preview) {
      onImport(preview, simbriefAircraftId);
      onClose();
    }
  };

  const tabClass = (t: string) =>
    `flex-1 py-1.5 text-center font-mono text-[10px] transition-colors ${
      tab === t ? "text-avionics-cyan bg-avionics-button-active border-b-2 border-avionics-cyan" : "text-avionics-label hover:bg-avionics-button-hover"
    }`;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-avionics-panel-dark/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-avionics-divider bg-avionics-panel">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-avionics-cyan" />
          <span className="font-mono text-xs text-avionics-white">Import Flight Plan</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-avionics-button-hover rounded transition-colors">
          <X className="w-4 h-4 text-avionics-label" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-avionics-divider">
        <button onClick={() => { setTab("simbrief"); setError(null); setPreview(null); }} className={tabClass("simbrief")}>SIMBRIEF</button>
        <button onClick={() => { setTab("file"); setError(null); setPreview(null); }} className={tabClass("file")}>FILE</button>
        <button onClick={() => { setTab("text"); setError(null); setPreview(null); }} className={tabClass("text")}>TEXT</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "file" && !preview && (
          <div className="flex flex-col items-center gap-3">
            <div className="text-[9px] text-avionics-label font-mono text-center leading-relaxed">
              Supported formats:<br />
              • Garmin .fpl (GTN/GNS XML)<br />
              • Text/CSV (IDENT,LAT,LNG per line)
            </div>
            <input ref={fileRef} type="file" accept=".fpl,.xml,.txt,.csv" className="hidden" onChange={handleFile} />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-avionics-button hover:bg-avionics-button-hover rounded avionics-bezel transition-colors"
            >
              <FileText className="w-4 h-4 text-avionics-cyan" />
              <span className="font-mono text-[10px] text-avionics-white">Choose File</span>
            </button>
          </div>
        )}

        {tab === "text" && !preview && (
          <div className="flex flex-col gap-2">
            <div className="text-[9px] text-avionics-label font-mono">
              Enter waypoints, one per line:<br />
              IDENT,LAT,LNG (e.g. KSFO,37.6213,-122.3790)
            </div>
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder={`KSFO,37.6213,-122.3790\nSALIN,36.6628,-121.6064\nKMRY,36.5870,-121.8430`}
              className="w-full h-32 p-2 bg-avionics-inset text-avionics-white font-mono text-[10px] rounded border border-avionics-divider focus:border-avionics-cyan outline-none resize-none"
            />
            <button
              onClick={handleTextParse}
              className="self-end px-3 py-1.5 bg-avionics-button hover:bg-avionics-button-hover rounded avionics-bezel font-mono text-[10px] text-avionics-cyan transition-colors"
            >
              Parse
            </button>
          </div>
        )}

        {tab === "simbrief" && !preview && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[9px] text-avionics-label font-mono leading-relaxed">
              <Plane className="w-4 h-4 text-avionics-green shrink-0" />
              <span>Fetch your latest OFP from SimBrief. Enter your Pilot ID or username.</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={simbriefId}
                onChange={e => setSimbriefId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSimbriefFetch()}
                placeholder="Pilot ID or username"
                className="flex-1 px-2 py-1.5 bg-avionics-inset text-avionics-white font-mono text-[10px] rounded border border-avionics-divider focus:border-avionics-cyan outline-none"
              />
              <button
                onClick={handleSimbriefFetch}
                disabled={loading}
                className="px-3 py-1.5 bg-avionics-button hover:bg-avionics-button-hover rounded avionics-bezel font-mono text-[10px] text-avionics-green transition-colors disabled:opacity-50"
              >
                {loading ? "..." : "Fetch"}
              </button>
            </div>
            <div className="text-[8px] text-avionics-label/60 font-mono">
              Find your Pilot ID at simbrief.com → Account Settings
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="w-3.5 h-3.5 text-avionics-amber shrink-0" />
            <span className="font-mono text-[9px] text-avionics-amber">{error}</span>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="flex flex-col gap-2">
            <div className="text-[9px] text-avionics-green font-mono">
              ✓ {preview.length} waypoints parsed{simbriefMeta ? ` • ${simbriefMeta}` : ""}
            </div>
            <div className="border border-avionics-divider rounded overflow-hidden">
              <div className="flex items-center px-2 py-1 bg-avionics-panel/50 border-b border-avionics-divider/50 gap-2">
                <span className="flex-1 text-[8px] text-avionics-label">Waypoint</span>
                <span className="w-10 text-[8px] text-avionics-label text-right">DTK</span>
                <span className="w-10 text-[8px] text-avionics-label text-right">DIS</span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {preview.map((wp, i) => (
                  <div key={wp.id} className="flex items-center px-2 py-1 gap-2 border-b border-avionics-divider/20">
                    <span className="flex-1 font-mono text-[10px] text-avionics-white">{wp.name}</span>
                    <span className="w-10 font-mono text-[10px] text-avionics-magenta text-right">{i > 0 ? `${wp.dtk}°` : "---"}</span>
                    <span className="w-10 font-mono text-[10px] text-avionics-cyan text-right">{i > 0 ? wp.dis : "---"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-avionics-label font-mono">
              Total: <span className="text-avionics-white">{preview.reduce((s, w) => s + w.dis, 0).toFixed(1)} NM</span>
              &nbsp;•&nbsp; {preview[0]?.name} → {preview[preview.length - 1]?.name}
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      {preview && (
        <div className="flex items-stretch border-t border-avionics-divider bg-avionics-panel">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-center font-mono text-[10px] text-avionics-label hover:bg-avionics-button-hover border-r border-avionics-divider transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 text-center font-mono text-[10px] text-avionics-green hover:bg-avionics-button-hover transition-colors"
          >
            Load Flight Plan
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Flight Plan Export ─── */

function exportGarminFpl(flightPlan: FlightPlanWaypoint[]) {
  const typeMap: Record<string, string> = {
    airport: "AIRPORT", vor: "VOR", ndb: "NDB", fix: "INT", user: "USER WAYPOINT",
  };

  const wpTableXml = flightPlan.map(wp =>
    `    <waypoint>
      <identifier>${wp.name}</identifier>
      <type>${typeMap[wp.type] || "INT"}</type>
      <country-code></country-code>
      <lat>${wp.lat.toFixed(6)}</lat>
      <lon>${wp.lng.toFixed(6)}</lon>
      <comment></comment>
    </waypoint>`
  ).join("\n");

  const routePointsXml = flightPlan.map(wp =>
    `      <route-point>
        <waypoint-identifier>${wp.name}</waypoint-identifier>
        <waypoint-type>${typeMap[wp.type] || "INT"}</waypoint-type>
        <waypoint-country-code></waypoint-country-code>
      </route-point>`
  ).join("\n");

  const routeName = `${flightPlan[0]?.name || "ORIG"} - ${flightPlan[flightPlan.length - 1]?.name || "DEST"}`;

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<flight-plan xmlns="http://www8.garmin.com/xmlschemas/FlightPlan/v1">
  <created>${new Date().toISOString()}</created>
  <waypoint-table>
${wpTableXml}
  </waypoint-table>
  <route>
    <route-name>${routeName}</route-name>
    <route-description>Exported from SimGlass Avionics</route-description>
${routePointsXml}
  </route>
</flight-plan>`;

  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${flightPlan[0]?.name || "FPL"}_${flightPlan[flightPlan.length - 1]?.name || "DEST"}.fpl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Existing Components ─── */

const WaypointIcon = ({ type }: { type: FlightPlanWaypoint["type"] }) => {
  switch (type) {
    case "airport":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" className="text-avionics-cyan shrink-0">
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1" />
          <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    case "vor":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" className="text-avionics-cyan shrink-0">
          <polygon points="7,1 13,13 1,13" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    default:
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-avionics-cyan shrink-0">
          <polygon points="6,1 11,6 6,11 1,6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
  }
};

/* ─── VNAV Profile SVG ─── */
const VnavProfile = ({ flightPlan, activeWaypointIndex }: { flightPlan: FlightPlanWaypoint[]; activeWaypointIndex: number }) => {
  const W = 420;
  const H = 110;
  const PAD = { top: 18, bottom: 22, left: 36, right: 12 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const data = useMemo(() => {
    let cumDist = 0;
    const pts = flightPlan.map((wp, i) => {
      if (i > 0) cumDist += wp.dis;
      return { ...wp, cumDist, alt: wp.alt || 0, index: i };
    });
    const maxDist = cumDist || 1;
    const alts = pts.map(p => p.alt);
    const maxAlt = Math.max(...alts, 500);
    const minAlt = Math.min(...alts, 0);
    const altRange = maxAlt - minAlt || 1;

    const toX = (d: number) => PAD.left + (d / maxDist) * plotW;
    const toY = (a: number) => PAD.top + plotH - ((a - minAlt) / altRange) * plotH;

    return { pts, maxDist, maxAlt, minAlt, altRange, toX, toY };
  }, [flightPlan]);

  const { pts, maxAlt, minAlt, toX, toY } = data;

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.cumDist).toFixed(1)},${toY(p.alt).toFixed(1)}`).join(" ");
  const fillD = `${pathD} L${toX(pts[pts.length - 1].cumDist).toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${PAD.left},${(PAD.top + plotH).toFixed(1)} Z`;

  const altSteps = 4;
  const altGridLines = Array.from({ length: altSteps + 1 }, (_, i) => {
    const alt = minAlt + ((maxAlt - minAlt) * i) / altSteps;
    return { alt: Math.round(alt), y: toY(alt) };
  });

  const acPt = pts[activeWaypointIndex];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block">
      {altGridLines.map((g, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={g.y} x2={W - PAD.right} y2={g.y} stroke="hsl(var(--avionics-divider))" strokeWidth="0.5" strokeDasharray="2,3" />
          <text x={PAD.left - 3} y={g.y + 3} textAnchor="end" className="fill-avionics-label" fontSize="7" fontFamily="monospace">
            {g.alt >= 1000 ? `${(g.alt / 1000).toFixed(1)}k` : g.alt}
          </text>
        </g>
      ))}

      <line x1={PAD.left} y1={PAD.top + plotH} x2={W - PAD.right} y2={PAD.top + plotH} stroke="hsl(var(--avionics-divider))" strokeWidth="1" />
      <path d={fillD} fill="hsl(var(--avionics-green) / 0.06)" />
      <path d={pathD} fill="none" stroke="hsl(var(--avionics-magenta))" strokeWidth="1.5" strokeLinejoin="round" />

      {pts.map((p, i) => {
        const x = toX(p.cumDist);
        const y = toY(p.alt);
        const isPast = i < activeWaypointIndex;
        const isActive = i === activeWaypointIndex;

        return (
          <g key={p.id}>
            <line x1={x} y1={y} x2={x} y2={PAD.top + plotH} stroke={isPast ? "hsl(var(--avionics-divider))" : "hsl(var(--avionics-cyan) / 0.3)"} strokeWidth="0.5" strokeDasharray="2,2" />
            <polygon
              points={`${x},${y - 4} ${x + 3},${y} ${x},${y + 4} ${x - 3},${y}`}
              fill={isActive ? "hsl(var(--avionics-magenta))" : isPast ? "hsl(var(--avionics-divider))" : "hsl(var(--avionics-cyan))"}
              stroke="none"
            />
            {p.alt > 0 && !isPast && (
              <text x={x} y={y - 7} textAnchor="middle" fontSize="7" fontFamily="monospace"
                className={isActive ? "fill-avionics-magenta" : "fill-avionics-cyan"}>
                {p.alt}
              </text>
            )}
            <text x={x} y={PAD.top + plotH + 10} textAnchor="middle" fontSize="6.5" fontFamily="monospace"
              className={isActive ? "fill-avionics-magenta" : isPast ? "fill-avionics-label" : "fill-avionics-white"}>
              {p.name}
            </text>
          </g>
        );
      })}

      {acPt && (
        <g transform={`translate(${toX(acPt.cumDist)}, ${toY(acPt.alt)})`}>
          <polygon points="0,-5 3,3 0,1 -3,3" fill="hsl(var(--avionics-green))" />
          <circle r="6" fill="hsl(var(--avionics-green) / 0.15)" />
        </g>
      )}

      <text x={PAD.left + 2} y={PAD.top - 6} fontSize="8" fontFamily="monospace" className="fill-avionics-cyan" fontWeight="bold">
        VNAV PROFILE
      </text>
      <text x={W - PAD.right} y={PAD.top - 6} textAnchor="end" fontSize="7" fontFamily="monospace" className="fill-avionics-label">
        ALT (ft)
      </text>
    </svg>
  );
};

export const FlightPlanScreen = () => {
  const { flightPlan, activeWaypointIndex, setActiveWaypoint, setFlightPlan, setSelectedAircraft, navigateTo } = useGtn();
  const [selectedWp, setSelectedWp] = useState<number | null>(null);
  const [showVnav, setShowVnav] = useState(true);
  const [showImport, setShowImport] = useState(false);

  const totalDist = flightPlan.reduce((sum, wp) => sum + wp.dis, 0);
  const remainingDist = flightPlan.slice(activeWaypointIndex).reduce((sum, wp) => sum + wp.dis, 0);

  const activeAlt = flightPlan[activeWaypointIndex]?.alt || 0;
  const nextConstraintIdx = flightPlan.findIndex((wp, i) => i > activeWaypointIndex && wp.alt);
  const nextConstraint = nextConstraintIdx >= 0 ? flightPlan[nextConstraintIdx] : null;
  const vnavTargetAlt = nextConstraint?.alt || 0;
  const distToConstraint = nextConstraint
    ? flightPlan.slice(activeWaypointIndex, nextConstraintIdx + 1).reduce((s, w) => s + w.dis, 0)
    : 0;
  const requiredVs = distToConstraint > 0 && vnavTargetAlt !== activeAlt
    ? Math.round(((vnavTargetAlt - activeAlt) / distToConstraint) * 100)
    : 0;

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden relative">
      {/* Import dialog overlay */}
      {showImport && (
        <ImportDialog
          onImport={(plan, aircraftId) => {
            setFlightPlan(plan);
            if (aircraftId) setSelectedAircraft(aircraftId);
          }}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-avionics-white">Active Flight Plan</span>
          <button
            onClick={() => setShowVnav(v => !v)}
            className={`px-2 py-0.5 rounded text-[8px] font-mono avionics-bezel transition-colors ${
              showVnav
                ? "bg-avionics-cyan/20 text-avionics-cyan border border-avionics-cyan/30"
                : "bg-avionics-button text-avionics-label hover:bg-avionics-button-hover"
            }`}
          >
            VNAV
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="px-2 py-0.5 rounded text-[8px] font-mono avionics-bezel bg-avionics-button text-avionics-cyan hover:bg-avionics-button-hover transition-colors flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
            IMPORT
          </button>
          <button
            onClick={() => exportGarminFpl(flightPlan)}
            className="px-2 py-0.5 rounded text-[8px] font-mono avionics-bezel bg-avionics-button text-avionics-green hover:bg-avionics-button-hover transition-colors flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            EXPORT
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-avionics-label">
            DIS: <span className="text-avionics-cyan font-mono">{remainingDist} NM</span>
          </span>
          <span className="text-[9px] text-avionics-label">
            TOT: <span className="text-avionics-white font-mono">{totalDist} NM</span>
          </span>
        </div>
      </div>

      {/* VNAV Profile */}
      {showVnav && (
        <div className="border-b border-avionics-divider bg-avionics-panel-dark">
          <VnavProfile flightPlan={flightPlan} activeWaypointIndex={activeWaypointIndex} />
          <div className="flex items-center justify-between px-3 py-1 border-t border-avionics-divider/50 bg-avionics-panel/30">
            <div className="flex items-center gap-3">
              <span className="text-[8px] text-avionics-label font-mono">
                V/S REQ <span className="text-avionics-magenta">{requiredVs > 0 ? "+" : ""}{requiredVs} fpm</span>
              </span>
              <span className="text-[8px] text-avionics-label font-mono">
                TGT <span className="text-avionics-cyan">{vnavTargetAlt || "---"} ft</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[8px] text-avionics-label font-mono">
                DIST <span className="text-avionics-white">{distToConstraint} NM</span>
              </span>
              <span className="text-[8px] font-mono text-avionics-green">V PATH</span>
            </div>
          </div>
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center px-3 py-1 bg-avionics-panel/50 border-b border-avionics-divider/50 gap-2">
        <span className="w-5 text-[8px] text-avionics-label" />
        <span className="flex-1 text-[8px] text-avionics-label">Waypoint</span>
        <span className="w-10 text-[8px] text-avionics-label text-right">DTK</span>
        <span className="w-10 text-[8px] text-avionics-label text-right">DIS</span>
        <span className="w-12 text-[8px] text-avionics-label text-right">ALT</span>
        <span className="w-12 text-[8px] text-avionics-label text-right">ETE</span>
      </div>

      {/* Waypoint list */}
      <div className="flex-1 overflow-y-auto">
        {flightPlan.map((wp, i) => {
          const isActive = i === activeWaypointIndex;
          const isPast = i < activeWaypointIndex;
          const isSelected = i === selectedWp;

          return (
            <button
              key={wp.id}
              onClick={() => setSelectedWp(isSelected ? null : i)}
              className={`w-full flex items-center px-3 py-2 gap-2 border-b border-avionics-divider/30 transition-colors ${
                isSelected ? "bg-avionics-button-active" : isActive ? "bg-avionics-green/5" : "hover:bg-avionics-button-hover/50"
              }`}
            >
              <div className="w-5 flex justify-center">
                {isActive && (
                  <svg width="8" height="10" viewBox="0 0 8 10" className="text-avionics-magenta">
                    <polygon points="0,0 8,5 0,10" fill="currentColor" />
                  </svg>
                )}
              </div>

              <div className="flex-1 flex items-center gap-1.5">
                <WaypointIcon type={wp.type} />
                <span className={`font-mono text-xs ${
                  isPast ? "text-avionics-label" : isActive ? "text-avionics-magenta" : "text-avionics-white"
                }`}>
                  {wp.name}
                </span>
              </div>

              <span className={`w-10 font-mono text-[11px] text-right ${isPast ? "text-avionics-label" : "text-avionics-magenta"}`}>
                {wp.dtk}°
              </span>
              <span className={`w-10 font-mono text-[11px] text-right ${isPast ? "text-avionics-label" : "text-avionics-white"}`}>
                {wp.dis}
              </span>
              <span className={`w-12 font-mono text-[11px] text-right ${isPast ? "text-avionics-label" : "text-avionics-cyan"}`}>
                {wp.alt || "---"}
              </span>
              <span className={`w-12 font-mono text-[11px] text-right ${isPast ? "text-avionics-label" : "text-avionics-white"}`}>
                {wp.ete}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected waypoint options */}
      {selectedWp !== null && (
        <div className="flex items-stretch border-t border-avionics-divider bg-avionics-panel">
          <button
            onClick={() => { setActiveWaypoint(selectedWp); setSelectedWp(null); }}
            className="flex-1 py-2 text-center font-mono text-[10px] text-avionics-green hover:bg-avionics-button-hover border-r border-avionics-divider transition-colors"
          >
            Activate Leg
          </button>
          <button
            onClick={() => { navigateTo("directto"); }}
            className="flex-1 py-2 text-center font-mono text-[10px] text-avionics-cyan hover:bg-avionics-button-hover border-r border-avionics-divider transition-colors"
          >
            Direct To →
          </button>
          <button
            className="flex-1 py-2 text-center font-mono text-[10px] text-avionics-amber hover:bg-avionics-button-hover transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      {/* Bottom info */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-avionics-divider bg-avionics-panel">
        <span className="font-mono text-[9px] text-avionics-label">
          {flightPlan[0]?.name} → {flightPlan[flightPlan.length - 1]?.name}
        </span>
        <span className="font-mono text-[9px] text-avionics-green">GPS</span>
      </div>
    </div>
  );
};
