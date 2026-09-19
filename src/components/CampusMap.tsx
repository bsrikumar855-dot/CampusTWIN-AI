import { CAMPUS_LOCATIONS, CampusBlock, LocationState } from "../lib/types";
import { STRESS_COLOR } from "../lib/digitalTwin";

interface CampusMapProps {
  state: Record<CampusBlock, LocationState>;
}

export function CampusMap({ state }: CampusMapProps) {
  const W = 480;
  const H = 360;
  const padding = 50;
  const gridW = W - padding * 2;
  const gridH = H - padding * 2;

  const toX = (gx: number) => padding + (gx / 6) * gridW;
  const toY = (gy: number) => padding + ((6 - gy) / 6) * gridH;

  const nodes = (Object.keys(CAMPUS_LOCATIONS) as CampusBlock[]).map((name) => {
    const s = state[name];
    const color = STRESS_COLOR[s.resource_stress] || "#3498db";
    const r = 22 + Math.min(30, s.utilization / 3);
    return { name, s, color, r, cx: toX(s.x), cy: toY(s.y) };
  });

  return (
    <div className="overflow-hidden rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">
        Digital Campus Map <span className="text-xs font-normal text-slate-400">(color = resource stress)</span>
      </h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 360 }}>
        {/* Ground */}
        <rect x={padding - 20} y={padding - 20} width={gridW + 40} height={gridH + 40} rx={12}
          fill="#f5f6fa" stroke="#dfe6e9" strokeWidth={1.5} />

        {/* Connections */}
        <g stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 4">
          <line x1={toX(1)} y1={toY(3)} x2={toX(3)} y2={toY(3)} />
          <line x1={toX(3)} y1={toY(3)} x2={toX(5)} y2={toY(3)} />
          <line x1={toX(3)} y1={toY(3)} x2={toX(3)} y2={toY(5)} />
          <line x1={toX(3)} y1={toY(3)} x2={toX(3)} y2={toY(1)} />
          <line x1={toX(1)} y1={toY(1)} x2={toX(3)} y2={toY(1)} />
          <line x1={toX(3)} y1={toY(1)} x2={toX(5)} y2={toY(1)} />
        </g>

        {/* Nodes */}
        {nodes.map(({ name, s, color, r, cx, cy }) => (
          <g key={name}>
            {s.resource_stress === "High" && (
              <circle cx={cx} cy={cy} r={r + 6} fill={color} opacity={0.2} className="pulse-ring" />
            )}
            <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.85}
              stroke="#2d3436" strokeWidth={2} />
            <text x={cx} y={cy + 4} textAnchor="middle" className="fill-white text-[10px] font-bold pointer-events-none">
              {Math.round(s.utilization)}%
            </text>
            <text x={cx} y={cy - r - 6} textAnchor="middle"
              className="fill-slate-700 text-[11px] font-semibold pointer-events-none">
              {name}
            </text>
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(${padding - 10}, ${H - 28})`}>
          <circle cx={8} cy={8} r={6} fill={STRESS_COLOR.Low} />
          <text x={20} y={12} className="fill-slate-600 text-[10px]">Low</text>
          <circle cx={60} cy={8} r={6} fill={STRESS_COLOR.Medium} />
          <text x={72} y={12} className="fill-slate-600 text-[10px]">Medium</text>
          <circle cx={130} cy={8} r={6} fill={STRESS_COLOR.High} />
          <text x={142} y={12} className="fill-slate-600 text-[10px]">High</text>
        </g>
      </svg>
    </div>
  );
}
