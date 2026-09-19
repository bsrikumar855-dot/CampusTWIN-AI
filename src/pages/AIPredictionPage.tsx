import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { KPICard } from "../components/KPICard";
import { LocationTable } from "../components/LocationTable";
import { runSimulation } from "../lib/simulator";
import { CampusBlock, ScenarioInput } from "../lib/types";

interface Props {
  inputs: ScenarioInput;
}

export function AIPredictionPage({ inputs }: Props) {
  const sim = useMemo(() => runSimulation(inputs), [inputs]);
  const k = sim.kpis;
  const state = sim.twin_state;
  const names = Object.keys(state) as CampusBlock[];

  const chartData = names.map((n) => ({
    name: n,
    occupancy: state[n].predicted_occupancy,
    capacity: state[n].capacity,
  }));

  return (
    <div className="animate-fadeIn space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">AI Prediction</h2>
        <p className="text-sm text-slate-500">
          Enter future conditions; the trained models predict campus outcomes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title="Predicted Occupancy" value={Math.round(k.predicted_occupancy)} />
        <KPICard title="Energy Demand" value={`${Math.round(k.energy_demand)} kWh`} />
        <KPICard
          title="Resource Stress"
          value={k.resource_stress}
          state={k.resource_stress === "High" ? "crit" : k.resource_stress === "Medium" ? "warn" : "ok"}
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Prediction Breakdown by Location</h3>
        <LocationTable state={state} showPredicted />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Predicted Occupancy vs Capacity</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="occupancy" name="Predicted Occupancy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="capacity" name="Capacity" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
        Model metrics — Occupancy MAE: 12.76, Energy MAE: 11.68, Stress Accuracy: 96.9%
        (trained on 800 synthetic campus records)
      </div>
    </div>
  );
}
