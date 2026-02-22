import { useState } from "react";
import { useGtn } from "../GtnContext";

interface WaypointData {
  id: string;
  name: string;
  fullName: string;
  type: "airport" | "vor" | "ndb" | "fix";
  lat: string;
  lon: string;
  elev?: number;
  freq?: string;
  magVar?: string;
  runways?: { id: string; length: number; width: number; surface: string; ils?: string }[];
  comFreqs?: { name: string; freq: string }[];
  nearbyNavaids?: { id: string; type: string; freq: string; dist: number; brg: number }[];
}

const waypointDb: WaypointData[] = [
  {
    id: "KMRY",
    name: "KMRY",
    fullName: "Monterey Regional",
    type: "airport",
    lat: "N36°35'15\"",
    lon: "W121°50'46\"",
    elev: 257,
    magVar: "13°E",
    runways: [
      { id: "10R/28L", length: 7616, width: 150, surface: "Asphalt", ils: "ILS 10R 109.90" },
      { id: "10L/28R", length: 4517, width: 150, surface: "Asphalt" },
    ],
    comFreqs: [
      { name: "ATIS", freq: "118.40" },
      { name: "Tower", freq: "119.52" },
      { name: "Ground", freq: "121.70" },
      { name: "Approach", freq: "133.00" },
      { name: "Departure", freq: "127.15" },
      { name: "CTAF", freq: "119.52" },
    ],
    nearbyNavaids: [
      { id: "MRY", type: "VOR/DME", freq: "117.30", dist: 2.1, brg: 195 },
      { id: "SNS", type: "VOR/DME", freq: "117.30", dist: 12.4, brg: 122 },
      { id: "PRB", type: "NDB", freq: "353", dist: 38.2, brg: 145 },
    ],
  },
  {
    id: "KSNS",
    name: "KSNS",
    fullName: "Salinas Municipal",
    type: "airport",
    lat: "N36°39'46\"",
    lon: "W121°36'22\"",
    elev: 137,
    magVar: "13°E",
    runways: [
      { id: "08/26", length: 4825, width: 100, surface: "Asphalt" },
      { id: "13/31", length: 3008, width: 75, surface: "Asphalt" },
    ],
    comFreqs: [
      { name: "CTAF", freq: "118.10" },
      { name: "AWOS", freq: "128.50" },
    ],
    nearbyNavaids: [
      { id: "SNS", type: "VOR/DME", freq: "117.30", dist: 0.8, brg: 310 },
    ],
  },
  {
    id: "MRY",
    name: "MRY",
    fullName: "Monterey VOR/DME",
    type: "vor",
    lat: "N36°34'01\"",
    lon: "W121°47'32\"",
    freq: "117.30",
    magVar: "13°E",
  },
  {
    id: "GIPVY",
    name: "GIPVY",
    fullName: "GIPVY Intersection",
    type: "fix",
    lat: "N36°40'12\"",
    lon: "W121°44'18\"",
  },
  {
    id: "JELCO",
    name: "JELCO",
    fullName: "JELCO Intersection",
    type: "fix",
    lat: "N36°38'05\"",
    lon: "W121°48'40\"",
  },
];

const typeColors: Record<string, string> = {
  airport: "text-avionics-cyan",
  vor: "text-avionics-green",
  ndb: "text-avionics-amber",
  fix: "text-avionics-magenta",
};

const typeBadge: Record<string, string> = {
  airport: "bg-avionics-cyan/15 text-avionics-cyan",
  vor: "bg-avionics-green/15 text-avionics-green",
  ndb: "bg-avionics-amber/15 text-avionics-amber",
  fix: "bg-avionics-magenta/15 text-avionics-magenta",
};

export const WaypointScreen = () => {
  const { flightPlan } = useGtn();
  const [selected, setSelected] = useState<string>("KMRY");
  const [search, setSearch] = useState("");

  const wp = waypointDb.find((w) => w.id === selected);

  const filtered = search.trim()
    ? waypointDb.filter((w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.fullName.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <div className="flex-1 flex flex-col bg-avionics-inset avionics-inset-shadow overflow-hidden">
      {/* Title */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white">WAYPOINT INFO</span>
      </div>

      {/* Search bar + quick picks */}
      <div className="px-2 py-1.5 bg-avionics-panel-dark border-b border-avionics-divider flex gap-1.5 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
          placeholder="Search..."
          className="flex-1 bg-avionics-button rounded px-2 py-1 font-mono text-[10px] text-avionics-white placeholder:text-avionics-label outline-none border border-avionics-divider focus:border-avionics-cyan/50"
        />
        {flightPlan.slice(0, 4).map((wp) => (
          <button
            key={wp.id}
            onClick={() => { setSelected(wp.name); setSearch(""); }}
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono transition-colors ${
              selected === wp.name
                ? "bg-avionics-cyan/20 text-avionics-cyan"
                : "text-avionics-label hover:text-avionics-white"
            }`}
          >
            {wp.name}
          </button>
        ))}
      </div>

      {/* Search results dropdown */}
      {filtered && filtered.length > 0 && (
        <div className="bg-avionics-panel border-b border-avionics-divider max-h-24 overflow-auto">
          {filtered.map((w) => (
            <button
              key={w.id}
              onClick={() => { setSelected(w.id); setSearch(""); }}
              className="w-full flex items-center gap-2 px-3 py-1 hover:bg-avionics-button-hover text-left"
            >
              <span className={`font-mono text-[10px] ${typeColors[w.type]}`}>{w.name}</span>
              <span className="text-[9px] text-avionics-label truncate">{w.fullName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Waypoint detail */}
      {wp ? (
        <div className="flex-1 overflow-auto px-2 py-1.5 space-y-2">
          {/* Identity */}
          <div className="bg-avionics-panel rounded border border-avionics-divider p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`font-mono text-sm ${typeColors[wp.type]}`}>{wp.name}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase ${typeBadge[wp.type]}`}>
                  {wp.type}
                </span>
              </div>
              {wp.freq && (
                <span className="font-mono text-xs text-avionics-green">{wp.freq}</span>
              )}
            </div>
            <span className="text-[10px] text-avionics-label block">{wp.fullName}</span>
            <div className="flex gap-4 mt-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-avionics-label">LAT</span>
                <span className="font-mono text-[10px] text-avionics-white">{wp.lat}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-avionics-label">LON</span>
                <span className="font-mono text-[10px] text-avionics-white">{wp.lon}</span>
              </div>
            </div>
            <div className="flex gap-4 mt-1">
              {wp.elev !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-avionics-label">ELEV</span>
                  <span className="font-mono text-[10px] text-avionics-white">{wp.elev}' MSL</span>
                </div>
              )}
              {wp.magVar && (
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-avionics-label">VAR</span>
                  <span className="font-mono text-[10px] text-avionics-white">{wp.magVar}</span>
                </div>
              )}
            </div>
          </div>

          {/* Runways */}
          {wp.runways && wp.runways.length > 0 && (
            <div className="bg-avionics-panel rounded border border-avionics-divider overflow-hidden">
              <div className="px-2 py-1 border-b border-avionics-divider">
                <span className="text-[9px] text-avionics-amber font-mono">RUNWAYS</span>
              </div>
              <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-x-3 px-2 py-0.5 text-[8px] text-avionics-label border-b border-avionics-divider/50">
                <span>RWY</span><span>LENGTH</span><span>WIDTH</span><span>SFC</span>
              </div>
              {wp.runways.map((rwy) => (
                <div key={rwy.id} className="grid grid-cols-[auto_1fr_1fr_1fr] gap-x-3 px-2 py-1 border-b border-avionics-divider/30 last:border-0">
                  <span className="font-mono text-[10px] text-avionics-cyan">{rwy.id}</span>
                  <span className="font-mono text-[10px] text-avionics-white">{rwy.length}'</span>
                  <span className="font-mono text-[10px] text-avionics-white">{rwy.width}'</span>
                  <span className="font-mono text-[10px] text-avionics-label">{rwy.surface}</span>
                  {rwy.ils && (
                    <span className="col-span-4 font-mono text-[9px] text-avionics-green ml-2">{rwy.ils}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* COM Frequencies */}
          {wp.comFreqs && wp.comFreqs.length > 0 && (
            <div className="bg-avionics-panel rounded border border-avionics-divider overflow-hidden">
              <div className="px-2 py-1 border-b border-avionics-divider">
                <span className="text-[9px] text-avionics-cyan font-mono">FREQUENCIES</span>
              </div>
              {wp.comFreqs.map((cf) => (
                <div key={cf.name} className="flex items-center justify-between px-2 py-0.5 border-b border-avionics-divider/30 last:border-0">
                  <span className="text-[10px] text-avionics-label">{cf.name}</span>
                  <span className="font-mono text-[10px] text-avionics-cyan">{cf.freq}</span>
                </div>
              ))}
            </div>
          )}

          {/* Nearby Navaids */}
          {wp.nearbyNavaids && wp.nearbyNavaids.length > 0 && (
            <div className="bg-avionics-panel rounded border border-avionics-divider overflow-hidden">
              <div className="px-2 py-1 border-b border-avionics-divider">
                <span className="text-[9px] text-avionics-green font-mono">NEARBY NAVAIDS</span>
              </div>
              <div className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-x-3 px-2 py-0.5 text-[8px] text-avionics-label border-b border-avionics-divider/50">
                <span>ID</span><span>TYPE</span><span>FREQ</span><span>BRG</span><span>DIST</span>
              </div>
              {wp.nearbyNavaids.map((nav) => (
                <div key={nav.id} className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-x-3 px-2 py-1 border-b border-avionics-divider/30 last:border-0">
                  <span className="font-mono text-[10px] text-avionics-green">{nav.id}</span>
                  <span className="font-mono text-[9px] text-avionics-label">{nav.type}</span>
                  <span className="font-mono text-[10px] text-avionics-white">{nav.freq}</span>
                  <span className="font-mono text-[10px] text-avionics-white">{nav.brg}°</span>
                  <span className="font-mono text-[10px] text-avionics-white">{nav.dist} NM</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="font-mono text-[10px] text-avionics-label">No waypoint data</span>
        </div>
      )}
    </div>
  );
};
