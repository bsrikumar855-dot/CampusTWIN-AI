import { KPICard } from "../components/KPICard";
import { VerdictBox, RecommendationList } from "../components/Recommendation";
import { SimulationResult, RecommendationResult } from "../lib/types";

interface Props {
  sim: SimulationResult | null;
  rec: RecommendationResult | null;
}

export function OptimizationPage({ sim, rec }: Props) {
  if (!sim) {
    return (
      <div className="animate-fadeIn">
        <h2 className="text-2xl font-bold text-slate-800">Optimization & Resource Analysis</h2>
        <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-slate-400">
          Run a simulation first (from What-If Simulator) to see resource analysis here.
        </div>
      </div>
    );
  }

  const k = sim.kpis;
  const r = sim.resource_estimates;

  return (
    <div className="animate-fadeIn space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Optimization & Resource Analysis</h2>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-bold text-slate-800">KPI Summary</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <KPICard title="Occupancy" value={Math.round(k.predicted_occupancy)} />
          <KPICard title="Energy" value={`${Math.round(k.energy_demand)} kWh`} />
          <KPICard title="Utilization" value={`${Math.round(k.room_utilization)}%`} />
          <KPICard title="Congestion" value={Math.round(k.predicted_congestion)} />
          <KPICard title="Stress" value={k.resource_stress} state={k.resource_stress === "High" ? "crit" : k.resource_stress === "Medium" ? "warn" : "ok"} />
          <KPICard title="Extra Seats" value={k.resource_requirement.extra_seats} state={k.resource_requirement.extra_seats > 0 ? "crit" : "ok"} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-bold text-slate-800">Resource Requirement Estimates</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <KPICard title="Required Seats" value={r.required_seats} />
          <KPICard title="Required Classrooms" value={r.required_classrooms} />
          <KPICard title="Electricity" value={`${r.required_electricity_kwh} kWh`} />
          <KPICard title="Parking" value={`${r.parking_requirement} slots`} />
          <KPICard title="Canteen Load" value={`${r.canteen_load} occ`} />
          <KPICard title="Facility Load" value={`${r.facility_load_pct}%`} />
        </div>
      </div>

      {/* Facility load gauge */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Facility Load</h3>
        <div className="relative h-8 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, r.facility_load_pct)}%`,
              backgroundColor:
                r.facility_load_pct >= 85 ? "#e74c3c" : r.facility_load_pct >= 60 ? "#f39c12" : "#27ae60",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700">
            {r.facility_load_pct}% Load
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>0%</span><span>60% (warn)</span><span>85% (critical)</span><span>100%+</span>
        </div>
      </div>

      {rec && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-800">Decision-Support Recommendations</h3>
          <VerdictBox verdict={rec.verdict} />
          <RecommendationList items={rec.recommendations} />
        </div>
      )}
    </div>
  );
}
