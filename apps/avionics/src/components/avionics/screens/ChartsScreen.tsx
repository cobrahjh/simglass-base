import { useState } from "react";
import { useGtn } from "../GtnContext";

type ChartType = "ILS" | "RNAV";

interface ApproachChart {
  id: string;
  name: string;
  type: ChartType;
  runway: string;
  frequency?: string;
  course: number;
  minimums: { da: number; vis: string };
  fixes: { name: string; alt: number; dist: number }[];
}

const charts: ApproachChart[] = [
  {
    id: "ils-10r",
    name: "ILS RWY 10R",
    type: "ILS",
    runway: "10R",
    frequency: "109.90",
    course: 101,
    minimums: { da: 437, vis: "1/2 SM" },
    fixes: [
      { name: "ZOTAY", alt: 3000, dist: 12.4 },
      { name: "RANEY", alt: 2600, dist: 8.2 },
      { name: "FIKDO", alt: 1700, dist: 5.0 },
      { name: "RW10R", alt: 437, dist: 0 },
    ],
  },
  {
    id: "rnav-10r",
    name: "RNAV (GPS) RWY 10R",
    type: "RNAV",
    runway: "10R",
    course: 101,
    minimums: { da: 520, vis: "3/4 SM" },
    fixes: [
      { name: "OXNAY", alt: 3000, dist: 14.1 },
      { name: "JELCO", alt: 2500, dist: 8.0 },
      { name: "SISGY", alt: 2000, dist: 6.0 },
      { name: "RW10R", alt: 520, dist: 0 },
    ],
  },
  {
    id: "rnav-28l",
    name: "RNAV (GPS) RWY 28L",
    type: "RNAV",
    runway: "28L",
    course: 281,
    minimums: { da: 680, vis: "1 SM" },
    fixes: [
      { name: "BERBI", alt: 3500, dist: 15.0 },
      { name: "MAFAF", alt: 2800, dist: 10.2 },
      { name: "CREAK", alt: 1500, dist: 5.0 },
      { name: "RW28L", alt: 680, dist: 0 },
    ],
  },
];

const ProfileView = ({ chart }: { chart: ApproachChart }) => {
  const maxAlt = Math.max(...chart.fixes.map((f) => f.alt));
  const maxDist = Math.max(...chart.fixes.map((f) => f.dist));

  return (
    <div className="flex-1 flex flex-col px-3 py-2 gap-2">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-avionics-amber">KMRY</span>
        <span className="font-mono text-[10px] text-avionics-white">{chart.name}</span>
      </div>

      {/* Minimums & Course */}
      <div className="flex items-center gap-4 px-2 py-1 bg-avionics-panel rounded">
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-avionics-label">CRS</span>
          <span className="font-mono text-xs text-avionics-magenta">{chart.course}°</span>
        </div>
        {chart.frequency && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-avionics-label">FREQ</span>
            <span className="font-mono text-xs text-avionics-cyan">{chart.frequency}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-avionics-label">DA</span>
          <span className="font-mono text-xs text-avionics-green">{chart.minimums.da}'</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-avionics-label">VIS</span>
          <span className="font-mono text-xs text-avionics-white">{chart.minimums.vis}</span>
        </div>
      </div>

      {/* Profile diagram */}
      <div className="flex-1 relative bg-avionics-inset rounded border border-avionics-divider min-h-[120px]">
        <svg width="100%" height="100%" viewBox="0 0 300 120" preserveAspectRatio="none">
          {/* Glidepath line */}
          <line
            x1={20}
            y1={15}
            x2={270}
            y2={100}
            stroke="hsl(300 80% 60%)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          {/* Ground line */}
          <line x1={20} y1={105} x2={280} y2={105} stroke="hsl(220 15% 25%)" strokeWidth="1" />

          {/* Fix markers */}
          {chart.fixes.map((fix, i) => {
            const x = maxDist > 0 ? 270 - (fix.dist / maxDist) * 250 : 270;
            const y = maxAlt > 0 ? 105 - (fix.alt / maxAlt) * 85 : 105;
            return (
              <g key={fix.name}>
                {/* Vertical dashed line */}
                <line x1={x} y1={y} x2={x} y2={105} stroke="hsl(220 15% 35%)" strokeWidth="0.5" strokeDasharray="2 2" />
                {/* Fix diamond */}
                <polygon
                  points={`${x},${y - 4} ${x + 4},${y} ${x},${y + 4} ${x - 4},${y}`}
                  fill={i === chart.fixes.length - 1 ? "hsl(160 100% 45%)" : "hsl(185 100% 55%)"}
                  stroke="none"
                />
                {/* Fix name */}
                <text x={x} y={y - 8} textAnchor="middle" fill="hsl(185 100% 55%)" fontSize="7" fontFamily="'Share Tech Mono', monospace">
                  {fix.name}
                </text>
                {/* Altitude */}
                <text x={x} y={112} textAnchor="middle" fill="hsl(0 0% 92%)" fontSize="6" fontFamily="'Share Tech Mono', monospace">
                  {fix.alt}'
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Fix table */}
      <div className="border border-avionics-divider rounded overflow-hidden">
        <div className="grid grid-cols-3 bg-avionics-panel px-2 py-0.5">
          <span className="text-[8px] text-avionics-label">FIX</span>
          <span className="text-[8px] text-avionics-label text-right">ALT</span>
          <span className="text-[8px] text-avionics-label text-right">DIST</span>
        </div>
        {chart.fixes.map((fix) => (
          <div key={fix.name} className="grid grid-cols-3 px-2 py-0.5 border-t border-avionics-divider/50">
            <span className="font-mono text-[10px] text-avionics-cyan">{fix.name}</span>
            <span className="font-mono text-[10px] text-avionics-white text-right">{fix.alt}'</span>
            <span className="font-mono text-[10px] text-avionics-white text-right">{fix.dist} NM</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartsScreen = () => {
  const [selectedChart, setSelectedChart] = useState<string>("ils-10r");
  const [filterType, setFilterType] = useState<ChartType | "ALL">("ALL");

  const filtered = filterType === "ALL" ? charts : charts.filter((c) => c.type === filterType);
  const active = charts.find((c) => c.id === selectedChart) || charts[0];

  return (
    <div className="flex-1 flex flex-col bg-avionics-inset avionics-inset-shadow overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white">CHARTS — KMRY</span>
        <div className="flex gap-1">
          {(["ALL", "ILS", "RNAV"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${
                filterType === t
                  ? "bg-avionics-cyan/20 text-avionics-cyan"
                  : "text-avionics-label hover:text-avionics-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Chart tabs */}
      <div className="flex gap-0.5 px-2 py-1 bg-avionics-panel-dark border-b border-avionics-divider overflow-x-auto">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedChart(c.id)}
            className={`px-2 py-1 rounded text-[9px] font-mono whitespace-nowrap transition-colors ${
              selectedChart === c.id
                ? "bg-avionics-button text-avionics-cyan"
                : "text-avionics-label hover:text-avionics-white"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Chart profile view */}
      <div className="flex-1 flex flex-col overflow-auto">
        <ProfileView chart={active} />
      </div>
    </div>
  );
};
