import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export type ConnectionMode = "none" | "flowpro" | "websocket" | "test";

export interface FlightData {
  altitude: number;
  speed: number;
  heading: number;
  verticalSpeed: number;
  groundSpeed: number;
  mach: number;
  lat: number;
  lng: number;
}

export interface FuelData {
  current: number;
  max: number;
  flow: number;
  endurance: string;
}

export interface NavigationData {
  currentWaypoint: string;
  nextWaypoint: string;
  distanceToNext: number;
  totalDistance: number;
  distanceRemaining: number;
  eta: string;
  dtk: number;
  activeLegIndex: number;
}

export interface WeatherData {
  location: string;
  condition: string;
  temperature: number;
  visibility: number;
  ceiling: number;
  pressure: number;
  windDir: number;
  windSpeed: number;
}

interface FlightDataContextValue {
  connectionMode: ConnectionMode;
  flight: FlightData;
  fuel: FuelData;
  navigation: NavigationData;
  weather: WeatherData;
  testMode: boolean;
  setTestMode: (on: boolean) => void;
  wsUrl: string;
  setWsUrl: (url: string) => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
}

const FlightDataContext = createContext<FlightDataContextValue | null>(null);

export const useFlightData = () => {
  const ctx = useContext(FlightDataContext);
  if (!ctx) throw new Error("useFlightData must be used within FlightDataProvider");
  return ctx;
};

// Flight plan waypoints with coordinates for simulation
const SIM_WAYPOINTS = [
  { name: "KSNS", lat: 36.6628, lng: -121.6064 },
  { name: "MANNA", lat: 36.7200, lng: -121.7100 },
  { name: "GIPVY", lat: 36.7600, lng: -121.8200 },
  { name: "JELCO", lat: 36.7900, lng: -121.8700 },
  { name: "SISGY", lat: 36.8100, lng: -121.9000 },
  { name: "RW31", lat: 36.5700, lng: -121.8400 },
  { name: "MAFAF", lat: 36.5900, lng: -121.8600 },
  { name: "KMRY", lat: 36.5870, lng: -121.8430 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function bearing(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function distNm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3440.065; // Earth radius in NM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const FlightDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("none");
  const [testMode, setTestModeState] = useState(false);
  const [wsUrl, setWsUrl] = useState("ws://192.168.1.42:8080");
  const wsRef = useRef<WebSocket | null>(null);
  const simRef = useRef({ legIndex: 0, legProgress: 0 });

  const [flight, setFlight] = useState<FlightData>({
    altitude: 0, speed: 0, heading: 0, verticalSpeed: 0, groundSpeed: 0, mach: 0,
    lat: 36.6628, lng: -121.6064,
  });

  const [fuel, setFuel] = useState<FuelData>({ current: 0, max: 0, flow: 0, endurance: "--:--" });

  const [navigation, setNavigation] = useState<NavigationData>({
    currentWaypoint: "---", nextWaypoint: "---", distanceToNext: 0,
    totalDistance: 0, distanceRemaining: 0, eta: "--:-- UTC", dtk: 0, activeLegIndex: 0,
  });

  const [weather, setWeather] = useState<WeatherData>({
    location: "----", condition: "---", temperature: 0, visibility: 0, ceiling: 0,
    pressure: 1013, windDir: 0, windSpeed: 0,
  });

  // Compute total flight plan distance
  const totalDist = SIM_WAYPOINTS.reduce((sum, wp, i) => {
    if (i === 0) return 0;
    return sum + distNm(SIM_WAYPOINTS[i - 1].lat, SIM_WAYPOINTS[i - 1].lng, wp.lat, wp.lng);
  }, 0);

  // Test mode simulation
  const setTestMode = useCallback((on: boolean) => {
    setTestModeState(on);
    if (on) {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      setConnectionMode("test");
      simRef.current = { legIndex: 1, legProgress: 0 };
      setFuel({ current: 8200, max: 12000, flow: 1800, endurance: "4:33" });
      setWeather({
        location: "KMRY", condition: "VFR", temperature: 16, visibility: 10,
        ceiling: 4500, pressure: 1012, windDir: 310, windSpeed: 12,
      });
    } else {
      setConnectionMode("none");
      setFlight({ altitude: 0, speed: 0, heading: 0, verticalSpeed: 0, groundSpeed: 0, mach: 0, lat: 36.6628, lng: -121.6064 });
      setFuel({ current: 0, max: 0, flow: 0, endurance: "--:--" });
      setNavigation({ currentWaypoint: "---", nextWaypoint: "---", distanceToNext: 0, totalDistance: 0, distanceRemaining: 0, eta: "--:-- UTC", dtk: 0, activeLegIndex: 0 });
      setWeather({ location: "----", condition: "---", temperature: 0, visibility: 0, ceiling: 0, pressure: 1013, windDir: 0, windSpeed: 0 });
    }
  }, []);

  useEffect(() => {
    if (!testMode) return;

    const interval = setInterval(() => {
      const sim = simRef.current;
      if (sim.legIndex >= SIM_WAYPOINTS.length) return;

      // Advance along flight plan
      sim.legProgress += 0.005 + Math.random() * 0.003;

      if (sim.legProgress >= 1) {
        sim.legProgress = 0;
        sim.legIndex = Math.min(sim.legIndex + 1, SIM_WAYPOINTS.length - 1);
      }

      const from = SIM_WAYPOINTS[Math.max(0, sim.legIndex - 1)];
      const to = SIM_WAYPOINTS[Math.min(sim.legIndex, SIM_WAYPOINTS.length - 1)];

      const curLat = lerp(from.lat, to.lat, sim.legProgress);
      const curLng = lerp(from.lng, to.lng, sim.legProgress);
      const hdg = Math.round(bearing(from.lat, from.lng, to.lat, to.lng));
      const gs = 120 + Math.floor(Math.random() * 10 - 5);
      const alt = sim.legIndex <= 2 ? 1500 + sim.legIndex * 750 : 3000;

      setFlight({
        altitude: alt + Math.floor(Math.random() * 50 - 25),
        speed: gs - 10 + Math.floor(Math.random() * 6),
        heading: hdg,
        verticalSpeed: sim.legProgress < 0.1 ? Math.floor(Math.random() * 300) : Math.floor(Math.random() * 60 - 30),
        groundSpeed: gs,
        mach: +(gs / 661).toFixed(2),
        lat: curLat,
        lng: curLng,
      });

      const distToNext = distNm(curLat, curLng, to.lat, to.lng);
      // Calculate remaining distance
      let remaining = distToNext;
      for (let i = sim.legIndex; i < SIM_WAYPOINTS.length - 1; i++) {
        remaining += distNm(SIM_WAYPOINTS[i].lat, SIM_WAYPOINTS[i].lng, SIM_WAYPOINTS[i + 1].lat, SIM_WAYPOINTS[i + 1].lng);
      }

      const eteSec = gs > 0 ? (remaining / gs) * 3600 : 0;
      const now = new Date();
      const etaDate = new Date(now.getTime() + eteSec * 1000);
      const eta = `${etaDate.getUTCHours().toString().padStart(2, "0")}:${etaDate.getUTCMinutes().toString().padStart(2, "0")} UTC`;

      setNavigation({
        currentWaypoint: from.name,
        nextWaypoint: to.name,
        distanceToNext: Math.round(distToNext * 10) / 10,
        totalDistance: Math.round(totalDist * 10) / 10,
        distanceRemaining: Math.round(remaining * 10) / 10,
        eta,
        dtk: hdg,
        activeLegIndex: sim.legIndex,
      });

      // Burn fuel
      setFuel(prev => {
        const burned = prev.flow / 3600; // per second → per 500ms tick
        const newCurrent = Math.max(0, prev.current - burned * 0.5);
        const hours = prev.flow > 0 ? newCurrent / prev.flow : 0;
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return { ...prev, current: Math.round(newCurrent), endurance: prev.flow > 0 ? `${h}:${m.toString().padStart(2, "0")}` : "--:--" };
      });
    }, 500);

    return () => clearInterval(interval);
  }, [testMode, totalDist]);

  // WebSocket bridge
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => {
        setConnectionMode("websocket");
        // Request Lovable format from SimGlass server
        ws.send(JSON.stringify({ type: 'setFormat', format: 'lovable' }));
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.flightData) setFlight(prev => ({ ...prev, ...data.flightData }));
          if (data.fuel) setFuel(prev => ({ ...prev, ...data.fuel }));
          if (data.navigation) setNavigation(prev => ({ ...prev, ...data.navigation }));
          if (data.weather) setWeather(prev => ({ ...prev, ...data.weather }));
        } catch (err) { console.error("WS parse error:", err); }
      };
      ws.onerror = (e) => console.error("WS error:", e);
      ws.onclose = () => { if (connectionMode === "websocket") setConnectionMode("none"); };
    } catch (err) { console.error("WS connect failed:", err); }
  }, [wsUrl, connectionMode]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setConnectionMode("none");
  }, []);

  // Check for Flow Pro API
  useEffect(() => {
    const flowProApi = (window as any).$api;
    if (flowProApi?.variables?.get) {
      setConnectionMode("flowpro");
      const fetchData = () => {
        try {
          const alt = Math.round(flowProApi.variables.get("A:INDICATED ALTITUDE", "feet") || 0);
          const ias = Math.round(flowProApi.variables.get("A:AIRSPEED INDICATED", "knots") || 0);
          const hdg = Math.round(flowProApi.variables.get("A:HEADING INDICATOR", "degrees") || 0);
          const vs = Math.round(flowProApi.variables.get("A:VERTICAL SPEED", "feet per minute") || 0);
          const gs = Math.round(flowProApi.variables.get("A:GROUND VELOCITY", "knots") || 0);
          const mach = flowProApi.variables.get("A:AIRSPEED MACH", "mach") || 0;
          const lat = flowProApi.variables.get("A:PLANE LATITUDE", "degrees") || 0;
          const lng = flowProApi.variables.get("A:PLANE LONGITUDE", "degrees") || 0;
          setFlight({ altitude: alt, speed: ias, heading: hdg, verticalSpeed: vs, groundSpeed: gs, mach, lat, lng });

          const totalCapGal = flowProApi.variables.get("A:FUEL TOTAL CAPACITY", "gallons") || 0;
          const totalQtyGal = flowProApi.variables.get("A:FUEL TOTAL QUANTITY", "gallons") || 0;
          const fuelFlowGPH = flowProApi.variables.get("A:ENG FUEL FLOW GPH:1", "gallons per hour") || 0;
          const currentFuel = Math.round(totalQtyGal * 6.7);
          const maxFuel = Math.round(totalCapGal * 6.7);
          const fuelFlow = Math.round(fuelFlowGPH * 6.7);
          let endurance = "--:--";
          if (fuelFlow > 0) { const hours = currentFuel / fuelFlow; const h = Math.floor(hours); const m = Math.round((hours - h) * 60); endurance = `${h}:${m.toString().padStart(2, "0")}`; }
          setFuel({ current: currentFuel, max: maxFuel, flow: fuelFlow, endurance });

          const wpIdent = flowProApi.variables.get("A:GPS WP NEXT ID", "string") || "---";
          const wpPrevIdent = flowProApi.variables.get("A:GPS WP PREV ID", "string") || "---";
          const wpDist = flowProApi.variables.get("A:GPS WP DISTANCE", "nautical miles") || 0;
          const eteSec = flowProApi.variables.get("A:GPS ETE", "seconds") || 0;
          const fpDist = flowProApi.variables.get("A:GPS FLIGHT PLAN TOTAL DISTANCE", "nautical miles") || 0;
          let eta = "--:-- UTC";
          if (eteSec > 0) { const now = new Date(); const etaDate = new Date(now.getTime() + eteSec * 1000); eta = `${etaDate.getUTCHours().toString().padStart(2, "0")}:${etaDate.getUTCMinutes().toString().padStart(2, "0")} UTC`; }
          const dtk = Math.round(flowProApi.variables.get("A:GPS WP DESIRED TRACK", "degrees") || 0);
          setNavigation({ currentWaypoint: wpPrevIdent, nextWaypoint: wpIdent, distanceToNext: Math.round(wpDist), totalDistance: Math.round(fpDist), distanceRemaining: Math.round(fpDist - wpDist), eta, dtk, activeLegIndex: 0 });

          setWeather({
            location: "LIVE", condition: "SIM",
            temperature: Math.round(flowProApi.variables.get("A:AMBIENT TEMPERATURE", "celsius") || 0),
            visibility: Math.round((flowProApi.variables.get("A:AMBIENT VISIBILITY", "meters") || 0) / 1609.34),
            ceiling: 0,
            pressure: Math.round(flowProApi.variables.get("A:AMBIENT PRESSURE", "millibars") || 1013),
            windDir: Math.round(flowProApi.variables.get("A:AMBIENT WIND DIRECTION", "degrees") || 0),
            windSpeed: Math.round(flowProApi.variables.get("A:AMBIENT WIND VELOCITY", "knots") || 0),
          });
        } catch (err) { console.error("Flow Pro error:", err); }
      };
      const interval = setInterval(fetchData, 500);
      fetchData();
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => { return () => { if (wsRef.current) wsRef.current.close(); }; }, []);

  return (
    <FlightDataContext.Provider value={{
      connectionMode, flight, fuel, navigation, weather,
      testMode, setTestMode, wsUrl, setWsUrl,
      connectWebSocket, disconnectWebSocket,
    }}>
      {children}
    </FlightDataContext.Provider>
  );
};
