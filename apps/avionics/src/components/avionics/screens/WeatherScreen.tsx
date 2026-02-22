export const WeatherScreen = () => {
  return (
    <div className="flex-1 flex flex-col bg-avionics-inset avionics-inset-shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white">SiriusXM Weather</span>
        <span className="font-mono text-[9px] text-avionics-green">NXRD:CMP</span>
      </div>

      {/* Weather radar display */}
      <div className="flex-1 relative">
        {/* Simulated NEXRAD overlay */}
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 55% 40%, hsl(120 80% 40% / 0.6) 0%, transparent 15%),
              radial-gradient(ellipse at 60% 35%, hsl(60 80% 50% / 0.5) 0%, transparent 10%),
              radial-gradient(ellipse at 58% 38%, hsl(0 80% 50% / 0.4) 0%, transparent 5%),
              radial-gradient(ellipse at 30% 60%, hsl(120 80% 40% / 0.4) 0%, transparent 20%),
              radial-gradient(ellipse at 35% 55%, hsl(60 80% 50% / 0.3) 0%, transparent 12%),
              radial-gradient(ellipse at 75% 70%, hsl(120 60% 35% / 0.3) 0%, transparent 18%),
              hsl(220 20% 6%)
            `
          }}
        />

        {/* Aircraft */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L12 22M12 2L8 8M12 2L16 8M4 14H20" stroke="hsl(0 0% 92%)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* METAR stations */}
        <div className="absolute top-[25%] right-[20%] flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-avionics-green" />
          <span className="font-mono text-[9px] text-avionics-green">VFR</span>
        </div>
        <div className="absolute top-[50%] right-[25%] flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-avionics-cyan" />
          <span className="font-mono text-[9px] text-avionics-cyan">MVFR</span>
        </div>
        <div className="absolute bottom-[35%] left-[20%] flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-avionics-amber" />
          <span className="font-mono text-[9px] text-avionics-amber">IFR</span>
        </div>

        {/* Right panel - overlays list */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-avionics-panel/90 border-l border-avionics-divider flex flex-col py-2 px-2 gap-1.5">
          <span className="text-[9px] text-avionics-label mb-1">Overlays</span>
          {["NEXRAD", "Lightning", "METAR:US", "METAR:CN", "Cell MVMT", "Winds Alft"].map((item, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${i < 3 ? "bg-avionics-green" : "bg-avionics-divider"}`} />
              <span className="font-mono text-[8px] text-avionics-white">{item}</span>
            </div>
          ))}
          <div className="mt-auto">
            <span className="font-mono text-[8px] text-avionics-label">Age: 2min</span>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 z-10">
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-2 bg-[hsl(120_80%_40%)]" />
            <span className="text-[7px] text-avionics-label">Light</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-2 bg-[hsl(60_80%_50%)]" />
            <span className="text-[7px] text-avionics-label">Mod</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-2 bg-[hsl(0_80%_50%)]" />
            <span className="text-[7px] text-avionics-label">Heavy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
