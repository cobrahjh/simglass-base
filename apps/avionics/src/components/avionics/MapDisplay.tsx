import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGtn } from "./GtnContext";
import { useFlightData } from "./FlightDataContext";
import { supabase } from "@/integrations/supabase/client";

const NEXRAD_URL = "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png";

// Terrain elevation tile layer (Mapzen/AWS Terrain Tiles — Terrarium encoding)
const TERRAIN_TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

const TERRAIN_LEGEND = [
  { color: "hsl(0, 90%, 45%)", label: "Impact (0-500 ft)" },
  { color: "hsl(30, 100%, 50%)", label: "Caution (500-1000 ft)" },
  { color: "hsl(50, 100%, 50%)", label: "Warning (1000-2000 ft)" },
  { color: "hsl(120, 60%, 35%)", label: "Clear (>2000 ft)" },
  { color: "hsl(220, 20%, 15%)", label: "Well below" },
];

const NEXRAD_LEGEND = [
  { color: "hsl(120 80% 35%)", label: "Light" },
  { color: "hsl(60 90% 45%)", label: "Mod" },
  { color: "hsl(30 100% 50%)", label: "Heavy" },
  { color: "hsl(0 90% 50%)", label: "Extreme" },
  { color: "hsl(300 70% 50%)", label: "Hail" },
];

// Nearby airports in central CA with known coordinates
const METAR_STATIONS: { icao: string; lat: number; lng: number }[] = [
  { icao: "KMRY", lat: 36.5870, lng: -121.8430 },
  { icao: "KSNS", lat: 36.6628, lng: -121.6064 },
  { icao: "KSJC", lat: 37.3626, lng: -121.9291 },
  { icao: "KSFO", lat: 37.6213, lng: -122.3790 },
  { icao: "KOAK", lat: 37.7213, lng: -122.2208 },
  { icao: "KWVI", lat: 36.9357, lng: -121.7897 },
  { icao: "KCVH", lat: 37.0590, lng: -121.5963 },
  { icao: "KHWD", lat: 37.6592, lng: -122.1217 },
  { icao: "KMOD", lat: 37.6258, lng: -120.9544 },
  { icao: "KSCK", lat: 37.8942, lng: -121.2386 },
  { icao: "KLVK", lat: 37.6934, lng: -121.8204 },
  { icao: "KNUQ", lat: 37.4161, lng: -122.0492 },
  { icao: "KPAO", lat: 37.4611, lng: -122.1150 },
  { icao: "KSQL", lat: 37.5119, lng: -122.2494 },
  { icao: "KRHV", lat: 37.3326, lng: -121.8198 },
  { icao: "KE16", lat: 37.0816, lng: -121.5973 },
  { icao: "KCIC", lat: 39.7954, lng: -121.8584 },
  { icao: "KPRB", lat: 35.6729, lng: -120.6271 },
  { icao: "KSBP", lat: 35.2368, lng: -120.6424 },
];

// Victor Airways with VOR waypoints
const VICTOR_AIRWAYS: { id: string; color: string; waypoints: { id: string; lat: number; lng: number; type: "VOR" | "FIX" }[] }[] = [
  {
    id: "V25",
    color: "hsl(185, 100%, 50%)",
    waypoints: [
      { id: "SFO", lat: 37.6197, lng: -122.3750, type: "VOR" },
      { id: "SJC", lat: 37.3720, lng: -121.9270, type: "VOR" },
      { id: "SNS", lat: 36.6628, lng: -121.6064, type: "VOR" },
      { id: "PRB", lat: 35.6729, lng: -120.6271, type: "VOR" },
      { id: "SBP", lat: 35.2368, lng: -120.6424, type: "VOR" },
    ],
  },
  {
    id: "V113",
    color: "hsl(40, 100%, 55%)",
    waypoints: [
      { id: "OAK", lat: 37.7253, lng: -122.2208, type: "VOR" },
      { id: "LVK", lat: 37.6934, lng: -121.8204, type: "VOR" },
      { id: "MOD", lat: 37.6258, lng: -120.9544, type: "VOR" },
      { id: "MRY", lat: 36.5670, lng: -121.7930, type: "VOR" },
      { id: "AVE", lat: 34.9544, lng: -118.3465, type: "VOR" },
    ],
  },
  {
    id: "V27",
    color: "hsl(120, 80%, 50%)",
    waypoints: [
      { id: "LAX", lat: 33.9425, lng: -118.4081, type: "VOR" },
      { id: "VNY", lat: 34.2098, lng: -118.4895, type: "VOR" },
      { id: "FLW", lat: 34.7461, lng: -118.3619, type: "VOR" },
      { id: "PMD", lat: 34.6294, lng: -118.0847, type: "VOR" },
      { id: "EHF", lat: 35.0833, lng: -117.8308, type: "VOR" },
    ],
  },
  {
    id: "V195",
    color: "hsl(280, 80%, 60%)",
    waypoints: [
      { id: "BFL", lat: 35.4336, lng: -119.0568, type: "VOR" },
      { id: "VIS", lat: 36.3187, lng: -119.3929, type: "VOR" },
      { id: "FAT", lat: 36.7762, lng: -119.7181, type: "VOR" },
      { id: "MOD", lat: 37.6258, lng: -120.9544, type: "VOR" },
      { id: "SAC", lat: 38.5125, lng: -121.4944, type: "VOR" },
    ],
  },
  {
    id: "V230",
    color: "hsl(15, 90%, 55%)",
    waypoints: [
      { id: "SBA", lat: 34.4262, lng: -119.8401, type: "VOR" },
      { id: "RZS", lat: 34.5214, lng: -119.1053, type: "VOR" },
      { id: "FIM", lat: 34.3533, lng: -118.5531, type: "VOR" },
      { id: "VNY", lat: 34.2098, lng: -118.4895, type: "VOR" },
      { id: "PDZ", lat: 33.9275, lng: -117.6900, type: "VOR" },
      { id: "PSP", lat: 33.8303, lng: -116.5067, type: "VOR" },
    ],
  },
];

// SIDs and STARs for KLAX
type ProcType = "SID" | "STAR";
const PROCEDURES: { id: string; type: ProcType; airport: string; color: string; waypoints: { id: string; lat: number; lng: number; alt?: string }[] }[] = [
  {
    id: "DOTSS2",
    type: "SID",
    airport: "KLAX",
    color: "hsl(160, 100%, 50%)",
    waypoints: [
      { id: "KLAX", lat: 33.9425, lng: -118.4081 },
      { id: "WAYVE", lat: 33.8500, lng: -118.5200, alt: "FL190" },
      { id: "SUMMR", lat: 33.7200, lng: -118.7000, alt: "FL230" },
      { id: "DOTSS", lat: 33.5500, lng: -118.9500, alt: "FL240" },
      { id: "CHRCL", lat: 33.3200, lng: -119.3000, alt: "FL250" },
    ],
  },
  {
    id: "SEAVU1",
    type: "SID",
    airport: "KLAX",
    color: "hsl(80, 90%, 50%)",
    waypoints: [
      { id: "KLAX", lat: 33.9425, lng: -118.4081 },
      { id: "HOLTZ", lat: 34.0600, lng: -118.2200, alt: "5000" },
      { id: "LIMBO", lat: 34.2500, lng: -117.9500, alt: "10000" },
      { id: "SEAVU", lat: 34.4500, lng: -117.6500, alt: "FL190" },
      { id: "HESPD", lat: 34.7300, lng: -117.3200, alt: "FL240" },
    ],
  },
  {
    id: "SADDE6",
    type: "STAR",
    airport: "KLAX",
    color: "hsl(30, 100%, 55%)",
    waypoints: [
      { id: "SADDE", lat: 35.5000, lng: -118.1000, alt: "FL280" },
      { id: "GRAMM", lat: 35.1000, lng: -118.0500, alt: "FL250" },
      { id: "FICKY", lat: 34.7000, lng: -118.1000, alt: "16000" },
      { id: "SYMON", lat: 34.3800, lng: -118.2200, alt: "12000" },
      { id: "KLAX", lat: 33.9425, lng: -118.4081, alt: "ILS" },
    ],
  },
  {
    id: "KIMMO3",
    type: "STAR",
    airport: "KLAX",
    color: "hsl(0, 85%, 55%)",
    waypoints: [
      { id: "KIMMO", lat: 34.1000, lng: -117.0000, alt: "FL260" },
      { id: "BULMA", lat: 34.0500, lng: -117.3500, alt: "FL230" },
      { id: "ROOBY", lat: 34.0200, lng: -117.7000, alt: "15000" },
      { id: "BAYST", lat: 33.9800, lng: -118.0500, alt: "10000" },
      { id: "KLAX", lat: 33.9425, lng: -118.4081, alt: "ILS" },
    ],
  },
];

type FlightCategory = "VFR" | "MVFR" | "IFR" | "LIFR" | "UNKN";

const CATEGORY_COLORS: Record<FlightCategory, string> = {
  VFR: "hsl(160, 100%, 45%)",
  MVFR: "hsl(210, 80%, 55%)",
  IFR: "hsl(0, 85%, 55%)",
  LIFR: "hsl(300, 80%, 60%)",
  UNKN: "hsl(220, 10%, 50%)",
};

interface MetarData {
  icaoId?: string;
  visib?: number;
  clouds?: { cover: string; base: number | null }[];
  fltCat?: string;
  rawOb?: string;
  wdir?: number;
  wspd?: number;
  temp?: number;
  dewp?: number;
}

function getFlightCategory(metar: MetarData): FlightCategory {
  // Use AWC-provided flight category if available
  if (metar.fltCat) {
    const cat = metar.fltCat.toUpperCase();
    if (cat === "VFR" || cat === "MVFR" || cat === "IFR" || cat === "LIFR") return cat;
  }

  const vis = metar.visib ?? 99;
  let ceiling = 99999;
  if (metar.clouds) {
    for (const c of metar.clouds) {
      if ((c.cover === "BKN" || c.cover === "OVC") && c.base !== null) {
        ceiling = Math.min(ceiling, c.base);
      }
    }
  }

  if (ceiling < 500 || vis < 1) return "LIFR";
  if (ceiling < 1000 || vis < 3) return "IFR";
  if (ceiling <= 3000 || vis <= 5) return "MVFR";
  return "VFR";
}

export const MapDisplay = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const aircraftMarker = useRef<L.Marker | null>(null);
  const nexradLayer = useRef<L.TileLayer | null>(null);
  const metarMarkers = useRef<L.LayerGroup | null>(null);
  const airwayLayers = useRef<L.LayerGroup | null>(null);
  const procLayers = useRef<L.LayerGroup | null>(null);
  const rangeLayers = useRef<L.LayerGroup | null>(null);
  const terrainLayer = useRef<L.GridLayer | null>(null);
  const baseTileLayer = useRef<L.TileLayer | null>(null);
  const { flightPlan, activeWaypointIndex, registerMapZoom } = useGtn();
  const { flight, connectionMode } = useFlightData();
  const isLive = connectionMode !== "none";
  const [nexradOn, setNexradOn] = useState(false);
  const [metarOn, setMetarOn] = useState(false);
  const [airwaysOn, setAirwaysOn] = useState(false);
  const [procOn, setProcOn] = useState(false);
  const [rangeOn, setRangeOn] = useState(false);
  const [terrainOn, setTerrainOn] = useState(false);
  const [metarData, setMetarData] = useState<Record<string, { category: FlightCategory; raw?: string }>>({});
  const [metarLoading, setMetarLoading] = useState(false);

  // Fetch METARs via edge function, fallback to simulated data
  const fetchMetars = useCallback(async () => {
    setMetarLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("aviation-weather", {
        body: { type: "metar", stations: METAR_STATIONS.map(s => s.icao) },
      });
      if (error) throw error;
      if (data?.success && Array.isArray(data.data?.metars)) {
        const parsed: Record<string, { category: FlightCategory; raw?: string }> = {};
        for (const m of data.data.metars as MetarData[]) {
          if (m.icaoId) {
            parsed[m.icaoId] = {
              category: getFlightCategory(m),
              raw: m.rawOb,
            };
          }
        }
        setMetarData(parsed);
        return;
      }
    } catch (err) {
      console.warn("Edge function unavailable, using simulated METAR data:", err);
    }

    // Fallback: simulated METAR data for demonstration
    const simCategories: FlightCategory[] = ["VFR", "VFR", "VFR", "MVFR", "VFR", "VFR", "VFR", "MVFR", "VFR", "VFR", "VFR", "IFR", "VFR", "MVFR", "VFR", "VFR", "VFR", "VFR", "LIFR"];
    const simRaws = [
      "KMRY 202053Z 31012KT 10SM FEW025 16/09 A2991",
      "KSNS 202053Z 30008KT 10SM CLR 18/07 A2992",
      "KSJC 202053Z 33010KT 10SM FEW020 17/10 A2990",
      "KSFO 202053Z 28018G25KT 6SM BR BKN015 13/10 A2989",
      "KOAK 202053Z 30012KT 10SM SCT020 15/09 A2990",
      "KWVI 202053Z 29006KT 10SM CLR 19/08 A2991",
      "KCVH 202053Z AUTO 00000KT 10SM CLR 20/06 A2992",
      "KHWD 202053Z 30014KT 7SM BKN018 14/10 A2989",
      "KMOD 202053Z 33008KT 10SM CLR 22/05 A2991",
      "KSCK 202053Z 34010KT 10SM FEW025 21/06 A2990",
      "KLVK 202053Z 30012KT 10SM SCT025 18/08 A2990",
      "KNUQ 202053Z 28015KT 2SM FG OVC003 12/11 A2988",
      "KPAO 202053Z 31008KT 10SM FEW020 16/10 A2990",
      "KSQL 202053Z 29012KT 5SM BR BKN020 14/10 A2989",
      "KRHV 202053Z 33006KT 10SM CLR 19/08 A2991",
      "KE16 202053Z AUTO 00000KT 10SM CLR 21/06 A2992",
      "KCIC 202053Z 00000KT 10SM CLR 24/04 A2993",
      "KPRB 202053Z 31010KT 10SM CLR 23/05 A2991",
      "KSBP 202053Z 28020G28KT 1SM FG OVC001 11/10 A2987",
    ];
    const parsed: Record<string, { category: FlightCategory; raw?: string }> = {};
    METAR_STATIONS.forEach((s, i) => {
      parsed[s.icao] = {
        category: simCategories[i] || "VFR",
        raw: simRaws[i] || `${s.icao} DATA UNAVAILABLE`,
      };
    });
    setMetarData(parsed);
    setMetarLoading(false);
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [flight.lat, flight.lng],
      zoom: 7,
      minZoom: 3,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
      zoomAnimation: true,
      zoomAnimationThreshold: 4,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });

    const isDark = !document.documentElement.classList.contains("light");
    baseTileLayer.current = L.tileLayer(
      isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19, noWrap: false }
    ).addTo(map);

    // Flight plan route polyline (magenta)
    const routeCoords = flightPlan.map((wp) => [wp.lat, wp.lng] as L.LatLngTuple);
    L.polyline(routeCoords, {
      color: "hsl(300, 80%, 60%)",
      weight: 3,
      opacity: 0.85,
      dashArray: "8, 6",
    }).addTo(map);

    // Waypoint markers
    flightPlan.forEach((wp, i) => {
      const isActive = i === activeWaypointIndex;
      const isAirport = wp.type === "airport";
      const size = isAirport ? 14 : 10;
      const color = isActive
        ? "hsl(300, 80%, 60%)"
        : isAirport
        ? "hsl(160, 100%, 45%)"
        : "hsl(185, 100%, 55%)";

      const icon = L.divIcon({
        className: "",
        html: isAirport
          ? `<svg width="${size}" height="${size}" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" fill="none" stroke="${color}" stroke-width="2"/><line x1="7" y1="1" x2="7" y2="13" stroke="${color}" stroke-width="1.2"/><line x1="1" y1="7" x2="13" y2="7" stroke="${color}" stroke-width="1.2"/></svg>`
          : `<svg width="${size}" height="${size}" viewBox="0 0 12 12"><polygon points="6,1 11,6 6,11 1,6" fill="${isActive ? color : 'none'}" stroke="${color}" stroke-width="1.5"/></svg>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([wp.lat, wp.lng], { icon }).addTo(map);
      marker.bindTooltip(
        `<span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:${color};background:hsla(220,20%,8%,0.85);padding:1px 4px;border:1px solid ${color};border-radius:2px;">${wp.name}${wp.alt ? ` ${wp.alt}'` : ""}</span>`,
        { permanent: true, direction: "right", offset: [6, 0], className: "leaflet-tooltip-avionics" }
      );
    });

    // Aircraft marker
    const aircraftIcon = L.divIcon({
      className: "",
      html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L12 22M12 2L8 8M12 2L16 8M4 14H20" stroke="hsl(0,0%,92%)" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    aircraftMarker.current = L.marker([flight.lat, flight.lng], { icon: aircraftIcon, zIndexOffset: 1000 }).addTo(map);
    metarMarkers.current = L.layerGroup();
    airwayLayers.current = L.layerGroup();
    procLayers.current = L.layerGroup();
    rangeLayers.current = L.layerGroup();
    mapInstance.current = map;

    // Register zoom controls with GtnContext
    registerMapZoom(
      () => map.zoomIn(1, { animate: true }),
      () => map.zoomOut(1, { animate: true }),
    );

    return () => { map.remove(); mapInstance.current = null; aircraftMarker.current = null; nexradLayer.current = null; metarMarkers.current = null; airwayLayers.current = null; procLayers.current = null; rangeLayers.current = null; terrainLayer.current = null; baseTileLayer.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync base tile layer with display mode
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!mapInstance.current || !baseTileLayer.current) return;
      const root = document.documentElement;
      const isLight = root.classList.contains("light");
      const isHighContrast = root.classList.contains("high-contrast");
      const newUrl = isLight
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        : isHighContrast
        ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      baseTileLayer.current.setUrl(newUrl);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Toggle NEXRAD layer
  useEffect(() => {
    if (!mapInstance.current) return;
    if (nexradOn) {
      if (!nexradLayer.current) {
        nexradLayer.current = L.tileLayer(NEXRAD_URL, {
          opacity: 0.55,
          maxZoom: 19,
          zIndex: 500,
        });
      }
      nexradLayer.current.addTo(mapInstance.current);
    } else {
      if (nexradLayer.current && mapInstance.current.hasLayer(nexradLayer.current)) {
        mapInstance.current.removeLayer(nexradLayer.current);
      }
    }
  }, [nexradOn]);

  // Toggle Airways layer
  useEffect(() => {
    if (!mapInstance.current || !airwayLayers.current) return;
    if (airwaysOn) {
      airwayLayers.current.clearLayers();

      for (const airway of VICTOR_AIRWAYS) {
        // Draw polyline for the airway
        const coords = airway.waypoints.map(wp => [wp.lat, wp.lng] as L.LatLngTuple);
        const line = L.polyline(coords, {
          color: airway.color,
          weight: 1.5,
          opacity: 0.7,
          dashArray: "6, 4",
        });
        airwayLayers.current.addLayer(line);

        // Airway label at midpoint
        const midIdx = Math.floor(airway.waypoints.length / 2);
        const midWp = airway.waypoints[midIdx];
        const labelIcon = L.divIcon({
          className: "",
          html: `<span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:${airway.color};background:hsla(220,20%,8%,0.85);padding:1px 4px;border:1px solid ${airway.color};border-radius:2px;">${airway.id}</span>`,
          iconSize: [40, 14],
          iconAnchor: [20, -4],
        });
        airwayLayers.current.addLayer(L.marker([midWp.lat, midWp.lng], { icon: labelIcon, interactive: false }));

        // VOR markers along the airway
        for (const wp of airway.waypoints) {
          const vorIcon = L.divIcon({
            className: "",
            html: `<svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,0 12,6 6,12 0,6" fill="none" stroke="${airway.color}" stroke-width="1.2"/><circle cx="6" cy="6" r="2" fill="${airway.color}" opacity="0.6"/></svg>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });
          const vorMarker = L.marker([wp.lat, wp.lng], { icon: vorIcon, zIndexOffset: 600 });
          vorMarker.bindTooltip(
            `<span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:${airway.color};background:hsla(220,20%,8%,0.85);padding:1px 4px;border:1px solid ${airway.color};border-radius:2px;">${wp.id} ${wp.type}</span>`,
            { direction: "right", offset: [8, 0], className: "leaflet-tooltip-avionics" }
          );
          airwayLayers.current.addLayer(vorMarker);
        }
      }

      airwayLayers.current.addTo(mapInstance.current);
    } else {
      if (mapInstance.current.hasLayer(airwayLayers.current)) {
        mapInstance.current.removeLayer(airwayLayers.current);
      }
    }
  }, [airwaysOn]);

  // Toggle Procedures layer
  useEffect(() => {
    if (!mapInstance.current || !procLayers.current) return;
    if (procOn) {
      procLayers.current.clearLayers();

      for (const proc of PROCEDURES) {
        const coords = proc.waypoints.map(wp => [wp.lat, wp.lng] as L.LatLngTuple);
        const isStar = proc.type === "STAR";

        // Solid line for procedures (different from dashed airways)
        const line = L.polyline(coords, {
          color: proc.color,
          weight: 2.5,
          opacity: 0.8,
          dashArray: isStar ? "4, 8" : undefined,
        });
        procLayers.current.addLayer(line);

        // Arrow markers to show direction
        const arrowIdx = Math.floor(coords.length / 2);
        const arrowIcon = L.divIcon({
          className: "",
          html: `<span style="font-family:'Share Tech Mono',monospace;font-size:8px;color:${proc.color};background:hsla(220,20%,8%,0.9);padding:1px 5px;border:1px solid ${proc.color};border-radius:2px;white-space:nowrap;">${isStar ? "▼" : "▲"} ${proc.id}</span>`,
          iconSize: [60, 14],
          iconAnchor: [30, -6],
        });
        procLayers.current.addLayer(L.marker(coords[arrowIdx], { icon: arrowIcon, interactive: false }));

        // Fix markers with altitude labels
        for (const wp of proc.waypoints) {
          if (wp.id === "KLAX") continue; // Skip airport marker
          const fixIcon = L.divIcon({
            className: "",
            html: `<svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,0 10,5 5,10 0,5" fill="${proc.color}" opacity="0.7" stroke="${proc.color}" stroke-width="0.8"/></svg>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          });
          const fixMarker = L.marker([wp.lat, wp.lng], { icon: fixIcon, zIndexOffset: 650 });
          const altLabel = wp.alt ? ` ${wp.alt}` : "";
          fixMarker.bindTooltip(
            `<div style="font-family:'Share Tech Mono',monospace;font-size:8px;background:hsla(220,20%,8%,0.9);padding:2px 5px;border:1px solid ${proc.color};border-radius:2px;">
              <span style="color:${proc.color};">${wp.id}</span><span style="color:hsl(0,0%,70%);">${altLabel}</span>
            </div>`,
            { direction: "right", offset: [6, 0], className: "leaflet-tooltip-avionics" }
          );
          procLayers.current.addLayer(fixMarker);
        }
      }

      procLayers.current.addTo(mapInstance.current);
    } else {
      if (mapInstance.current.hasLayer(procLayers.current)) {
        mapInstance.current.removeLayer(procLayers.current);
      }
    }
  }, [procOn]);

  // Toggle Range Rings
  useEffect(() => {
    if (!mapInstance.current || !rangeLayers.current) return;
    if (rangeOn) {
      rangeLayers.current.clearLayers();
      const NM_TO_METERS = 1852;

      [10, 20, 50].forEach((nm) => {
        const circle = L.circle([flight.lat, flight.lng], {
          radius: nm * NM_TO_METERS,
          color: "hsl(185, 100%, 55%)",
          weight: 1,
          opacity: 0.5,
          fill: false,
          dashArray: "6, 6",
          interactive: false,
        });
        rangeLayers.current!.addLayer(circle);

        const labelIcon = L.divIcon({
          className: "",
          html: `<span style="font-family:'Share Tech Mono',monospace;font-size:8px;color:hsl(185,100%,55%);background:hsla(220,20%,8%,0.85);padding:0 3px;border-radius:2px;">${nm} NM</span>`,
          iconSize: [36, 12],
          iconAnchor: [18, 6],
        });
        const labelLat = flight.lat + (nm * NM_TO_METERS) / 111320;
        rangeLayers.current!.addLayer(L.marker([labelLat, flight.lng], { icon: labelIcon, interactive: false }));
      });

      rangeLayers.current.addTo(mapInstance.current);
    } else {
      if (mapInstance.current.hasLayer(rangeLayers.current)) {
        mapInstance.current.removeLayer(rangeLayers.current);
      }
    }
  }, [rangeOn, flight.lat, flight.lng]);

  // Toggle Terrain Awareness layer
  useEffect(() => {
    if (!mapInstance.current) return;
    if (terrainOn) {
      if (terrainLayer.current) {
        mapInstance.current.removeLayer(terrainLayer.current);
      }

      const ownAlt = flight.altitude; // feet MSL

      const TerrainGrid = L.GridLayer.extend({
        createTile(coords: { x: number; y: number; z: number }, done: (err: Error | null, tile: HTMLCanvasElement) => void) {
          const tile = document.createElement("canvas");
          tile.width = 256;
          tile.height = 256;
          const ctx = tile.getContext("2d")!;

          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = TERRAIN_TILE_URL
            .replace("{z}", String(coords.z))
            .replace("{x}", String(coords.x))
            .replace("{y}", String(coords.y));

          img.onload = () => {
            ctx.drawImage(img, 0, 0, 256, 256);
            const imageData = ctx.getImageData(0, 0, 256, 256);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i], g = data[i + 1], b = data[i + 2];
              // Terrarium encoding: elevation = (r * 256 + g + b / 256) - 32768  (meters)
              const elevM = (r * 256 + g + b / 256) - 32768;
              const elevFt = elevM * 3.28084;
              const diff = ownAlt - elevFt; // positive = we're above terrain

              let cr: number, cg: number, cb: number, ca: number;
              if (elevFt <= 0) {
                // Water / below sea level — transparent
                cr = 0; cg = 0; cb = 0; ca = 0;
              } else if (diff < 500) {
                // Impact zone — red
                cr = 200; cg = 30; cb = 30; ca = 160;
              } else if (diff < 1000) {
                // Caution — orange
                cr = 230; cg = 130; cb = 20; ca = 140;
              } else if (diff < 2000) {
                // Warning — yellow
                cr = 220; cg = 200; cb = 30; ca = 100;
              } else if (diff < 4000) {
                // Clear — dark green
                cr = 40; cg = 120; cb = 50; ca = 70;
              } else {
                // Well below — dark blue-gray
                cr = 25; cg = 30; cb = 45; ca = 40;
              }

              data[i] = cr;
              data[i + 1] = cg;
              data[i + 2] = cb;
              data[i + 3] = ca;
            }

            ctx.putImageData(imageData, 0, 0);
            done(null as unknown as Error, tile);
          };
          img.onerror = () => {
            done(null as unknown as Error, tile);
          };
          return tile;
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      terrainLayer.current = new (TerrainGrid as any)({ maxZoom: 14, opacity: 0.7, zIndex: 400 }) as L.GridLayer;
      terrainLayer.current!.addTo(mapInstance.current);
    } else {
      if (terrainLayer.current && mapInstance.current.hasLayer(terrainLayer.current)) {
        mapInstance.current.removeLayer(terrainLayer.current);
        terrainLayer.current = null;
      }
    }
  }, [terrainOn, flight.altitude]);

  // Toggle METAR layer
  useEffect(() => {
    if (!mapInstance.current || !metarMarkers.current) return;
    if (metarOn) {
      fetchMetars();
      metarMarkers.current.addTo(mapInstance.current);
    } else {
      if (mapInstance.current.hasLayer(metarMarkers.current)) {
        mapInstance.current.removeLayer(metarMarkers.current);
      }
    }
  }, [metarOn, fetchMetars]);

  // Update METAR markers when data changes
  useEffect(() => {
    if (!metarMarkers.current || !metarOn) return;
    metarMarkers.current.clearLayers();

    for (const station of METAR_STATIONS) {
      const info = metarData[station.icao];
      const category = info?.category || "UNKN";
      const color = CATEGORY_COLORS[category];
      const size = 18;

      const icon = L.divIcon({
        className: "",
        html: `<svg width="${size}" height="${size}" viewBox="0 0 18 18">
          <circle cx="9" cy="9" r="6" fill="${color}" opacity="0.85" stroke="hsla(0,0%,0%,0.4)" stroke-width="1"/>
          <circle cx="9" cy="9" r="3" fill="hsla(0,0%,100%,0.3)"/>
        </svg>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([station.lat, station.lng], { icon, zIndexOffset: 800 });

      const tooltipContent = `<div style="font-family:'Share Tech Mono',monospace;font-size:9px;background:hsla(220,20%,8%,0.92);padding:3px 6px;border:1px solid ${color};border-radius:3px;max-width:220px;">
        <div style="color:${color};font-weight:bold;margin-bottom:2px;">${station.icao} — ${category}</div>
        ${info?.raw ? `<div style="color:hsl(0,0%,70%);font-size:8px;word-break:break-all;">${info.raw}</div>` : '<div style="color:hsl(0,0%,50%);font-size:8px;">No data</div>'}
      </div>`;

      marker.bindTooltip(tooltipContent, {
        direction: "top",
        offset: [0, -10],
        className: "leaflet-tooltip-avionics",
      });

      metarMarkers.current.addLayer(marker);
    }
  }, [metarData, metarOn]);

  // Update aircraft position when flight data changes
  useEffect(() => {
    if (!aircraftMarker.current || !mapInstance.current) return;
    aircraftMarker.current.setLatLng([flight.lat, flight.lng]);

    // Rotate aircraft SVG
    const el = aircraftMarker.current.getElement();
    if (el) {
      el.style.transformOrigin = "center center";
      el.style.transform = `${el.style.transform?.replace(/rotate\([^)]+\)/, '') || ''} rotate(${flight.heading}deg)`;
    }

    if (isLive) {
      mapInstance.current.panTo([flight.lat, flight.lng], { animate: true, duration: 0.5 });
    }
  }, [flight.lat, flight.lng, flight.heading, isLive]);

  return (
    <div className="flex-1 relative overflow-hidden bg-avionics-panel-dark">
      <div ref={mapRef} className="absolute inset-0" style={{ background: "hsl(220, 20%, 8%)" }} />

      {/* Connection status overlay */}
      <div className="absolute top-2 left-2 z-[1000] flex items-center gap-1.5" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-avionics-green animate-pulse" : "bg-avionics-divider"}`} />
        <span className="font-mono text-[9px] text-avionics-label bg-avionics-panel-dark/80 px-1.5 py-0.5 rounded">
          {connectionMode === "test" ? "TEST" : connectionMode === "flowpro" ? "FLOW PRO" : connectionMode === "websocket" ? "WS BRIDGE" : "STATIC"}
        </span>
      </div>

      {/* Map overlay toggles */}
      <div className="absolute top-2 right-2 z-[1000] flex flex-col items-end gap-1" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
        <div className="flex gap-1">
          <button
            onClick={() => setNexradOn(!nexradOn)}
            className={`font-mono text-[9px] px-2 py-1 rounded border transition-colors ${
              nexradOn
                ? "border-avionics-green text-avionics-green bg-avionics-panel-dark/90"
                : "border-avionics-divider text-avionics-label bg-avionics-panel-dark/80 hover:text-avionics-white"
            }`}
          >
            NXRD
          </button>
          <button
            onClick={() => setMetarOn(!metarOn)}
            className={`font-mono text-[9px] px-2 py-1 rounded border transition-colors ${
              metarOn
                ? "border-avionics-cyan text-avionics-cyan bg-avionics-panel-dark/90"
                : "border-avionics-divider text-avionics-label bg-avionics-panel-dark/80 hover:text-avionics-white"
            }`}
          >
            {metarLoading ? "METAR..." : "METAR"}
          </button>
          <button
            onClick={() => setAirwaysOn(!airwaysOn)}
            className={`font-mono text-[9px] px-2 py-1 rounded border transition-colors ${
              airwaysOn
                ? "border-avionics-amber text-avionics-amber bg-avionics-panel-dark/90"
                : "border-avionics-divider text-avionics-label bg-avionics-panel-dark/80 hover:text-avionics-white"
            }`}
          >
            AWYS
          </button>
          <button
            onClick={() => setProcOn(!procOn)}
            className={`font-mono text-[9px] px-2 py-1 rounded border transition-colors ${
              procOn
                ? "border-avionics-magenta text-avionics-magenta bg-avionics-panel-dark/90"
                : "border-avionics-divider text-avionics-label bg-avionics-panel-dark/80 hover:text-avionics-white"
            }`}
          >
            PROC
          </button>
          <button
            onClick={() => setRangeOn(!rangeOn)}
            className={`font-mono text-[9px] px-2 py-1 rounded border transition-colors ${
              rangeOn
                ? "border-avionics-cyan text-avionics-cyan bg-avionics-panel-dark/90"
                : "border-avionics-divider text-avionics-label bg-avionics-panel-dark/80 hover:text-avionics-white"
            }`}
          >
            RNG
          </button>
          <button
            onClick={() => setTerrainOn(!terrainOn)}
            className={`font-mono text-[9px] px-2 py-1 rounded border transition-colors ${
              terrainOn
                ? "border-destructive text-destructive bg-avionics-panel-dark/90"
                : "border-avionics-divider text-avionics-label bg-avionics-panel-dark/80 hover:text-avionics-white"
            }`}
          >
            TERR
          </button>
        </div>

        {/* Legends */}
        {(nexradOn || metarOn || airwaysOn || procOn || terrainOn) && (
          <div className="bg-avionics-panel-dark/90 border border-avionics-divider rounded px-2 py-1.5 flex flex-col gap-1 max-h-[200px] overflow-auto">
            {nexradOn && (
              <>
                <span className="font-mono text-[7px] text-avionics-label">NEXRAD</span>
                {NEXRAD_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="font-mono text-[7px] text-avionics-white">{item.label}</span>
                  </div>
                ))}
              </>
            )}
            {nexradOn && metarOn && <div className="border-t border-avionics-divider/50 my-0.5" />}
            {metarOn && (
              <>
                <span className="font-mono text-[7px] text-avionics-label">FLT CAT</span>
                {(["VFR", "MVFR", "IFR", "LIFR"] as FlightCategory[]).map((cat) => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                    <span className="font-mono text-[7px] text-avionics-white">{cat}</span>
                  </div>
                ))}
              </>
            )}
            {(nexradOn || metarOn) && airwaysOn && <div className="border-t border-avionics-divider/50 my-0.5" />}
            {airwaysOn && (
              <>
                <span className="font-mono text-[7px] text-avionics-label">AIRWAYS</span>
                {VICTOR_AIRWAYS.map((aw) => (
                  <div key={aw.id} className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 rounded" style={{ backgroundColor: aw.color }} />
                    <span className="font-mono text-[7px] text-avionics-white">{aw.id}</span>
                  </div>
                ))}
              </>
            )}
            {(nexradOn || metarOn || airwaysOn) && procOn && <div className="border-t border-avionics-divider/50 my-0.5" />}
            {procOn && (
              <>
                <span className="font-mono text-[7px] text-avionics-label">SID/STAR</span>
                {PROCEDURES.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 rounded" style={{ backgroundColor: p.color, borderStyle: p.type === "STAR" ? "dashed" : "solid" }} />
                    <span className="font-mono text-[7px] text-avionics-white">{p.type === "SID" ? "▲" : "▼"} {p.id}</span>
                  </div>
                ))}
              </>
            )}
            {(nexradOn || metarOn || airwaysOn || procOn) && terrainOn && <div className="border-t border-avionics-divider/50 my-0.5" />}
            {terrainOn && (
              <>
                <span className="font-mono text-[7px] text-avionics-label">TERRAIN ({flight.altitude} ft)</span>
                {TERRAIN_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="font-mono text-[7px] text-avionics-white">{item.label}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Range indicator */}
      <div className="absolute bottom-2 left-2 z-[1000] font-mono text-[9px] text-avionics-label bg-avionics-panel-dark/80 px-1.5 py-0.5 rounded" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
        20 NM
      </div>
    </div>
  );
};
