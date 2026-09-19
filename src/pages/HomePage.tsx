import { CampusMap } from "../components/CampusMap";
import { defaultTwinState } from "../lib/digitalTwin";
import { CAMPUS_LOCATIONS, CampusBlock } from "../lib/types";

const STEPS = ["Campus Data", "Digital Twin", "AI Prediction", "What-If Scenario", "Simulation", "Comparison", "Decision"];

export function HomePage() {
  const state = defaultTwinState();
  const totalOcc = Object.values(state).reduce((s, v) => s + v.current_occupancy, 0);
  const totalEnergy = Math.round(Object.values(state).reduce((s, v) => s + v.energy_demand, 0) * 100) / 100;
  const avgUtil = Math.round((Object.values(state).reduce((s, v) => s + v.utilization, 0) / Object.keys(state).length) * 10) / 10;
  const highStress = Object.values(state).filter((s) => s.resource_stress === "High").length;

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">TwinOpt AI</h1>
        <p className="mt-1 text-lg text-slate-500">AI-Powered What-If Simulator for Smart Campus Digital Twin</p>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Before changing the real campus, test the decision in its Digital Twin. Predict occupancy,
          energy, congestion and resource stress for any what-if scenario, then compare options and
          get decision support.
        </p>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-brand-600 px-3 py-2.5 text-center text-xs font-semibold text-white">
              {s}
            </div>
            {i < STEPS.length - 1 && <span className="text-brand-400">→</span>}
          </div>
        ))}
      </div>

      {/* Status cards */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-800">Current Campus Status</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-500">Total Occupancy</div>
            <div className="text-2xl font-bold text-slate-800">{totalOcc}</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-500">Total Energy</div>
            <div className="text-2xl font-bold text-slate-800">{totalEnergy} kWh</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-500">Avg Utilization</div>
            <div className="text-2xl font-bold text-slate-800">{avgUtil}%</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-500">High-Stress Zones</div>
            <div className="text-2xl font-bold text-slate-800">{highStress}</div>
          </div>
        </div>
      </div>

      <CampusMap state={state} />

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-slate-800">Project Overview</h2>
        <p className="text-sm text-slate-600">
          TwinOpt AI lets campus administrators simulate future campus conditions before implementing
          real-world decisions. Enter a what-if scenario (students, event, location, time,
          temperature) and the AI predicts occupancy, energy demand, room utilization, traffic
          congestion and resource stress across a virtual digital twin of the campus.
        </p>
        <p className="mt-2 text-sm font-semibold text-brand-700">
          Workflow: PREDICT → SIMULATE → COMPARE → OPTIMIZE → DECIDE
        </p>
      </div>
    </div>
  );
}
