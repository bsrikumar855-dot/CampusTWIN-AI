import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { CampusMap } from "../components/CampusMap";
import { LocationTable } from "../components/LocationTable";
import { ScenarioForm } from "../components/ScenarioForm";
import { runSimulation } from "../lib/simulator";
import { CampusBlock, ScenarioInput } from "../lib/types";
import { STRESS_COLOR } from "../lib/digitalTwin";

interface Props {
  inputs: ScenarioInput;
  onChange: (patch: Partial<ScenarioInput>) => void;
}

export function DigitalTwinPage({ inputs, onChange }: Props) {
  const sim = useMemo(() => runSimulation(inputs), [inputs]);
  const state = sim.twin_state;
  const names = Object.keys(state) as CampusBlock[];

  const utilData = names.map((n) => ({
    name: n,
    utilization: state[n].utilization,
    fill: STRESS_COLOR[state[n].resource_stress],
  }));
  const energyData = names.map((n) => ({
    name: n,
    energy: state[n].energy_demand,
  }));

  return (
    <div className="animate-fadeIn space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Digital Twin</h2>
        <p className="text-sm text-slate-500">
          Interactive virtual representation of the campus. Adjust the inputs in the sidebar to see
          how each location responds.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CampusMap state={state} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Location Details</h3>
          <LocationTable state={state} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Utilization by Location</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={utilData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis unit="%" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="utilization" name="Utilization %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Energy Demand by Location</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis unit=" kWh" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="energy" name="Energy (kWh)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
