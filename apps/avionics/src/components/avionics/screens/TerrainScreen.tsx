export const TerrainScreen = () => {
  return (
    <div className="flex-1 flex flex-col bg-avionics-inset avionics-inset-shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white">Terrain</span>
        <span className="font-mono text-[9px] text-avionics-green">OPER</span>
      </div>

      {/* Terrain display */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Simulated terrain coloring */}
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 40% 30%, hsl(0 60% 35%) 0%, transparent 30%),
              radial-gradient(ellipse at 60% 50%, hsl(40 60% 35%) 0%, transparent 35%),
              radial-gradient(ellipse at 30% 60%, hsl(40 60% 35%) 0%, transparent 25%),
              radial-gradient(ellipse at 70% 30%, hsl(120 40% 25%) 0%, transparent 40%),
              radial-gradient(ellipse at 50% 70%, hsl(120 40% 20%) 0%, transparent 45%),
              radial-gradient(ellipse at 20% 80%, hsl(120 50% 15%) 0%, transparent 35%),
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

        {/* Altitude markers */}
        <div className="absolute top-[20%] left-[35%]">
          <span className="font-mono text-[10px] text-avionics-amber avionics-glow-amber">4200</span>
        </div>
        <div className="absolute top-[40%] right-[30%]">
          <span className="font-mono text-[10px] text-destructive">5800</span>
        </div>
        <div className="absolute bottom-[30%] left-[40%]">
          <span className="font-mono text-[10px] text-avionics-green">2100</span>
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-0.5 z-10">
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 bg-[hsl(0_60%_35%)]" />
            <span className="text-[8px] text-avionics-label">Above</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 bg-[hsl(40_60%_35%)]" />
            <span className="text-[8px] text-avionics-label">Near</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 bg-[hsl(120_40%_25%)]" />
            <span className="text-[8px] text-avionics-label">Below</span>
          </div>
        </div>
      </div>
    </div>
  );
};
