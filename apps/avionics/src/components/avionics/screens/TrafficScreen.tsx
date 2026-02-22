import { useGtn } from "../GtnContext";

export const TrafficScreen = () => {
  const { com } = useGtn();

  return (
    <div className="flex-1 flex flex-col bg-avionics-inset avionics-inset-shadow overflow-hidden">
      {/* Traffic header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-avionics-white">⚡ Traffic</span>
        </div>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="text-avionics-label">ADS: <span className="text-avionics-green">On</span></span>
          <span className="text-avionics-label">TCAS: <span className="text-avionics-green">OPER</span></span>
          <span className="text-avionics-label">ALT: <span className="text-avionics-white">NORM</span></span>
        </div>
      </div>

      {/* Radar display */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Compass ring */}
        <div className="w-[220px] h-[220px] rounded-full border border-avionics-divider/50 relative">
          <div className="absolute inset-6 rounded-full border border-avionics-divider/30" />
          <div className="absolute inset-12 rounded-full border border-avionics-divider/20" />

          {/* Range labels */}
          <span className="absolute top-1 left-1/2 -translate-x-1/2 font-mono text-[9px] text-avionics-white">N</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[9px] text-avionics-label">6 NM</span>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-[9px] text-avionics-label">12 NM</span>

          {/* Own aircraft */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L8 14M8 2L5 6M8 2L11 6M3 10H13" stroke="hsl(0 0% 92%)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Traffic targets */}
          <div className="absolute top-[25%] left-[60%]">
            <div className="flex flex-col items-center">
              <span className="font-mono text-[10px] text-avionics-cyan">+05</span>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <polygon points="5,0 10,10 0,10" fill="hsl(185 100% 55%)" />
              </svg>
            </div>
          </div>

          <div className="absolute top-[45%] left-[35%]">
            <div className="flex flex-col items-center">
              <span className="font-mono text-[10px] text-avionics-cyan">+03</span>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <polygon points="5,0 10,10 0,10" fill="hsl(185 100% 55%)" />
              </svg>
            </div>
          </div>

          <div className="absolute top-[60%] right-[20%]">
            <div className="flex flex-col items-center">
              <span className="font-mono text-[10px] text-avionics-white">-06</span>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <polygon points="5,0 10,10 0,10" fill="hsl(0 0% 92%)" />
              </svg>
            </div>
          </div>

          <div className="absolute bottom-[20%] left-[25%]">
            <div className="flex flex-col items-center">
              <span className="font-mono text-[10px] text-avionics-white">+08</span>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <polygon points="5,0 10,10 0,10" fill="hsl(0 0% 92%)" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right side info */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 text-right">
          <span className="text-[9px] text-avionics-label">HDG UP</span>
          <div className="mt-2">
            <span className="font-mono text-[9px] text-avionics-white">N89TM</span>
          </div>
          <span className="text-[9px] text-avionics-label">Small</span>
          <span className="text-[9px] text-avionics-label">Aircraft</span>
          <span className="font-mono text-[9px] text-avionics-white">CR:~135 KT</span>
          <span className="font-mono text-[9px] text-avionics-white">TRK: 359°</span>
          <span className="font-mono text-[9px] text-avionics-green">GS: 200 KT</span>
        </div>
      </div>

      {/* Bottom info */}
      <div className="flex items-center justify-center py-1 border-t border-avionics-divider bg-avionics-panel">
        <span className="font-mono text-[9px] text-avionics-label">RELATIVE MOTION – 5 MIN</span>
      </div>
    </div>
  );
};
