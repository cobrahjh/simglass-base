import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Plane } from "lucide-react";
import { useGtn } from "../GtnContext";

type WxTab = "radar" | "metar" | "taf" | "winds" | "sigmet" | "icing";

interface MetarEntry {
  icaoId: string;
  rawOb: string;
  temp: number;
  dewp: number;
  wdir: number;
  wspd: number;
  wgst?: number;
  visib: number | string;
  altim: number;
  fltcat: string;
  reportTime: string;
  clouds?: { cover: string; base: number }[];
}

interface TafEntry {
  icaoId: string;
  rawTAF: string;
  issueTime: string;
  validTimeFrom: string;
  validTimeTo: string;
}

const DEFAULT_STATIONS = ["KMRY", "KSNS", "KSJC", "KSFO", "KOAK"];

const catColor: Record<string, string> = {
  VFR: "text-avionics-green",
  MVFR: "text-avionics-cyan",
  IFR: "text-destructive",
  LIFR: "text-avionics-magenta",
};

const windsData = [
  { alt: "3000", dir: 310, speed: 15, temp: "+12" },
  { alt: "6000", dir: 300, speed: 22, temp: "+06" },
  { alt: "9000", dir: 290, speed: 30, temp: "-01" },
  { alt: "12000", dir: 280, speed: 38, temp: "-08" },
  { alt: "18000", dir: 270, speed: 52, temp: "-18" },
  { alt: "24000", dir: 265, speed: 68, temp: "-30" },
];

const sigmetData = [
  { id: "WS1", type: "SIGMET", text: "SIGMET CHARLIE 3 VALID UNTIL 202100 — MOD TURB BLW FL200 WI AREA BOUNDED BY SFO-SAC-FAT-SBA-SFO" },
  { id: "WA1", type: "AIRMET", text: "AIRMET SIERRA — IFR CIG BLW 010/VIS BLW 3SM BR. NRN CA CSTL AREAS. CONDS CONTG BYD 2100Z" },
];

// Determine flight category from visibility and ceiling
function getFlightCategory(visibilityMiles: number, ceilingFt: number | null): string {
  if (visibilityMiles < 1 || (ceilingFt !== null && ceilingFt < 500)) return "LIFR";
  if (visibilityMiles < 3 || (ceilingFt !== null && ceilingFt < 1000)) return "IFR";
  if (visibilityMiles <= 5 || (ceilingFt !== null && ceilingFt <= 3000)) return "MVFR";
  return "VFR";
}

// Parse NOAA weather.gov observation into our MetarEntry format
function parseNOAAObs(feature: any): MetarEntry | null {
  try {
    const props = feature.properties;
    const stationId = props.station?.split("/").pop() || "";
    const rawOb = props.rawMessage || `${stationId} ${props.textDescription || ""}`;
    const tempC = props.temperature?.value != null ? Math.round(props.temperature.value) : 0;
    const dewpC = props.dewpoint?.value != null ? Math.round(props.dewpoint.value) : 0;
    const wdir = props.windDirection?.value != null ? Math.round(props.windDirection.value) : 0;
    const wspdMs = props.windSpeed?.value || 0;
    const wspd = Math.round(wspdMs * 1.944); // m/s to knots
    const wgstMs = props.windGust?.value || 0;
    const wgst = wgstMs > 0 ? Math.round(wgstMs * 1.944) : undefined;
    const visM = props.visibility?.value || 10000;
    const visSM = Math.round((visM / 1609.34) * 10) / 10;
    const altimPa = props.barometricPressure?.value || 101325;
    const altimInHg = Math.round((altimPa / 3386.39) * 100) / 100;

    // Find ceiling
    let ceilingFt: number | null = null;
    if (props.cloudLayers) {
      for (const layer of props.cloudLayers) {
        if (layer.amount === "BKN" || layer.amount === "OVC") {
          const baseFt = layer.base?.value != null ? Math.round(layer.base.value * 3.281) : null;
          if (baseFt !== null && (ceilingFt === null || baseFt < ceilingFt)) ceilingFt = baseFt;
        }
      }
    }

    const fltcat = getFlightCategory(visSM, ceilingFt);

    return {
      icaoId: stationId,
      rawOb,
      temp: tempC,
      dewp: dewpC,
      wdir,
      wspd,
      wgst,
      visib: visSM,
      altim: altimInHg,
      fltcat,
      reportTime: props.timestamp || "",
    };
  } catch {
    return null;
  }
}

export const WeatherDetailScreen = () => {
  const [activeTab, setActiveTab] = useState<WxTab>("metar");
  const [metars, setMetars] = useState<MetarEntry[]>([]);
  const [tafs, setTafs] = useState<TafEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { flightPlan } = useGtn();

  // Derive stations from flight plan airports, supplemented by defaults
  const stations = useMemo(() => {
    const fpAirports = flightPlan
      .filter(wp => wp.type === "airport")
      .map(wp => wp.name.toUpperCase());
    // Merge flight plan airports (priority) with defaults, deduplicated
    const merged = [...fpAirports];
    for (const s of DEFAULT_STATIONS) {
      if (!merged.includes(s)) merged.push(s);
    }
    return merged;
  }, [flightPlan]);

  // Identify departure and destination from flight plan
  const departure = useMemo(() => {
    const airports = flightPlan.filter(wp => wp.type === "airport");
    return airports.length > 0 ? airports[0].name.toUpperCase() : null;
  }, [flightPlan]);

  const destination = useMemo(() => {
    const airports = flightPlan.filter(wp => wp.type === "airport");
    return airports.length > 1 ? airports[airports.length - 1].name.toUpperCase() : null;
  }, [flightPlan]);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let metarsLoaded = false;

      // Attempt edge function first
      try {
        const { data, error: fnError } = await supabase.functions.invoke('aviation-weather', {
          body: { type: 'all', stations },
        });
        if (!fnError && data?.success) {
          if (Array.isArray(data.data?.metars)) { setMetars(data.data.metars); metarsLoaded = true; }
          if (Array.isArray(data.data?.tafs)) setTafs(data.data.tafs);
          setLastUpdate(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
          setLoading(false);
          return;
        }
      } catch { /* edge function not available, fall through */ }

      // Fallback: NOAA weather.gov API (CORS-friendly)
      const obsPromises = stations.map(async (station) => {
        try {
          const res = await fetch(
            `https://api.weather.gov/stations/${station}/observations/latest`,
            { headers: { "User-Agent": "GTN750Xi-Avionics", Accept: "application/geo+json" } }
          );
          if (!res.ok) return null;
          const data = await res.json();
          return parseNOAAObs(data);
        } catch { return null; }
      });

      const results = await Promise.all(obsPromises);
      const validMetars = results.filter((m): m is MetarEntry => m !== null);
      if (validMetars.length > 0) {
        setMetars(validMetars);
        metarsLoaded = true;
      }

      if (metarsLoaded) {
        setLastUpdate(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
      } else {
        setError("No weather data available");
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to connect to weather service');
    } finally {
      setLoading(false);
    }
  }, [stations]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      <div className="flex items-center px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white">Weather</span>
        {departure && destination && (
          <div className="flex items-center gap-1 ml-2">
            <Plane className="w-2.5 h-2.5 text-avionics-magenta" />
            <span className="font-mono text-[9px] text-avionics-magenta">{departure}→{destination}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {lastUpdate && (
            <span className="font-mono text-[9px] text-avionics-green">UPD {lastUpdate}Z</span>
          )}
          <button onClick={fetchWeather} disabled={loading} className="hover:opacity-80 transition-opacity">
            <RefreshCw className={`w-3 h-3 text-avionics-cyan ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-avionics-panel border-b border-avionics-divider overflow-x-auto">
        {([["radar", "Radar"], ["metar", "METAR"], ["taf", "TAF"], ["winds", "Winds"], ["sigmet", "SIGMET"], ["icing", "Icing"]] as [WxTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-1.5 text-[10px] font-mono whitespace-nowrap border-b-2 transition-colors ${
              activeTab === key ? "text-avionics-cyan border-avionics-cyan" : "text-avionics-label border-transparent hover:text-avionics-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-3 py-1.5 bg-destructive/10 border-b border-avionics-divider">
          <span className="font-mono text-[9px] text-destructive">{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {activeTab === "radar" && (
          <div className="flex-1 relative h-full min-h-[200px]">
            <div className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse at 55% 40%, hsl(120 80% 40% / 0.6) 0%, transparent 15%),
                  radial-gradient(ellipse at 60% 35%, hsl(60 80% 50% / 0.5) 0%, transparent 10%),
                  radial-gradient(ellipse at 58% 38%, hsl(0 80% 50% / 0.4) 0%, transparent 5%),
                  radial-gradient(ellipse at 30% 60%, hsl(120 80% 40% / 0.4) 0%, transparent 20%),
                  radial-gradient(ellipse at 75% 70%, hsl(120 60% 35% / 0.3) 0%, transparent 18%),
                  hsl(220 20% 6%)
                `
              }}
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-2 z-10">
              {[["hsl(120_80%_40%)", "Light"], ["hsl(60_80%_50%)", "Mod"], ["hsl(0_80%_50%)", "Heavy"], ["hsl(300_60%_50%)", "Extreme"]].map(([color, label]) => (
                <div key={label} className="flex items-center gap-0.5">
                  <div className="w-3 h-2" style={{ background: color.replace(/_/g, " ") }} />
                  <span className="text-[7px] text-avionics-label">{label}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-2 right-2 font-mono text-[9px] text-avionics-label z-10">Age: 2min</div>
          </div>
        )}

        {activeTab === "metar" && (
          <div>
            {loading && metars.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <span className="font-mono text-[10px] text-avionics-label">Loading METARs...</span>
              </div>
            ) : metars.length > 0 ? (
              metars.map((m, i) => (
                <div key={`${m.icaoId}-${i}`} className={`px-3 py-2.5 border-b border-avionics-divider/30 ${
                  m.icaoId === destination ? "bg-avionics-magenta/5 border-l-2 border-l-avionics-magenta" :
                  m.icaoId === departure ? "bg-avionics-cyan/5 border-l-2 border-l-avionics-cyan" : ""
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-avionics-white">{m.icaoId}</span>
                      {m.icaoId === destination && (
                        <span className="font-mono text-[7px] px-1 py-0.5 rounded bg-avionics-magenta/20 text-avionics-magenta">DEST</span>
                      )}
                      {m.icaoId === departure && (
                        <span className="font-mono text-[7px] px-1 py-0.5 rounded bg-avionics-cyan/20 text-avionics-cyan">DEP</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-avionics-label">
                        {m.temp !== undefined ? `${m.temp}/${m.dewp}°C` : ''}
                      </span>
                      <span className={`font-mono text-[10px] font-bold ${catColor[m.fltcat] || 'text-avionics-label'}`}>
                        {m.fltcat || 'UNK'}
                      </span>
                    </div>
                  </div>
                  <p className="font-mono text-[9px] text-avionics-label leading-relaxed break-all">{m.rawOb}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {m.wdir !== undefined && (
                      <span className="font-mono text-[8px] text-avionics-cyan">
                        {m.wdir === 0 ? 'VRB' : `${String(m.wdir).padStart(3, '0')}°`} {m.wspd}kt{m.wgst ? `G${m.wgst}` : ''}
                      </span>
                    )}
                    {m.visib !== undefined && (
                      <span className="font-mono text-[8px] text-avionics-green">VIS {m.visib}SM</span>
                    )}
                    {m.altim !== undefined && (
                      <span className="font-mono text-[8px] text-avionics-amber">A{Math.round(m.altim * 100) / 100}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-6 text-center">
                <span className="font-mono text-[10px] text-avionics-label">No METAR data available</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "taf" && (
          <div>
            {loading && tafs.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <span className="font-mono text-[10px] text-avionics-label">Loading TAFs...</span>
              </div>
            ) : tafs.length > 0 ? (
              tafs.map((t, i) => (
                <div key={`${t.icaoId}-${i}`} className="px-3 py-2.5 border-b border-avionics-divider/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-avionics-white">{t.icaoId}</span>
                    <span className="font-mono text-[9px] text-avionics-label">
                      {t.validTimeFrom?.slice(8, 10)}/{t.validTimeFrom?.slice(11, 13)}Z–{t.validTimeTo?.slice(8, 10)}/{t.validTimeTo?.slice(11, 13)}Z
                    </span>
                  </div>
                  <p className="font-mono text-[9px] text-avionics-label leading-relaxed break-all whitespace-pre-wrap">{t.rawTAF}</p>
                </div>
              ))
            ) : (
              <div className="px-3 py-6 text-center">
                <span className="font-mono text-[10px] text-avionics-label">No TAF data available</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "winds" && (
          <div>
            <div className="flex items-center px-3 py-1 bg-avionics-panel/50 border-b border-avionics-divider/50">
              <span className="w-16 text-[8px] text-avionics-label">Altitude</span>
              <span className="w-12 text-[8px] text-avionics-label text-right">Dir</span>
              <span className="w-12 text-[8px] text-avionics-label text-right">Speed</span>
              <span className="w-12 text-[8px] text-avionics-label text-right">Temp</span>
            </div>
            {windsData.map(w => (
              <div key={w.alt} className="flex items-center px-3 py-2 border-b border-avionics-divider/30">
                <span className="w-16 font-mono text-xs text-avionics-cyan">{w.alt} ft</span>
                <span className="w-12 font-mono text-xs text-avionics-magenta text-right">{w.dir}°</span>
                <span className="w-12 font-mono text-xs text-avionics-green text-right">{w.speed} kt</span>
                <span className="w-12 font-mono text-xs text-avionics-white text-right">{w.temp}°C</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "sigmet" && (
          <div>
            {sigmetData.map(s => (
              <div key={s.id} className="px-3 py-2.5 border-b border-avionics-divider/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    s.type === "SIGMET" ? "bg-destructive/20 text-destructive" : "bg-avionics-amber/20 text-avionics-amber"
                  }`}>
                    {s.type}
                  </span>
                </div>
                <p className="font-mono text-[9px] text-avionics-label leading-relaxed">{s.text}</p>
              </div>
            ))}
            <div className="px-3 py-4 text-center">
              <span className="font-mono text-[9px] text-avionics-divider">No additional advisories</span>
            </div>
          </div>
        )}

        {activeTab === "icing" && (
          <div className="flex-1 relative min-h-[200px]">
            <div className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse at 40% 35%, hsl(200 80% 60% / 0.3) 0%, transparent 25%),
                  radial-gradient(ellipse at 65% 55%, hsl(200 80% 60% / 0.2) 0%, transparent 20%),
                  radial-gradient(ellipse at 50% 70%, hsl(200 80% 60% / 0.15) 0%, transparent 30%),
                  hsl(220 20% 6%)
                `
              }}
            />
            <div className="absolute top-3 left-3 z-10">
              <span className="font-mono text-[9px] text-avionics-label">Icing Forecast — FL060-FL120</span>
            </div>
            <div className="absolute bottom-2 left-2 flex items-center gap-2 z-10">
              {[["hsl(200_60%_70%)", "Light"], ["hsl(200_80%_50%)", "Mod"], ["hsl(200_90%_35%)", "Severe"]].map(([color, label]) => (
                <div key={label} className="flex items-center gap-0.5">
                  <div className="w-3 h-2" style={{ background: color.replace(/_/g, " ") }} />
                  <span className="text-[7px] text-avionics-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
