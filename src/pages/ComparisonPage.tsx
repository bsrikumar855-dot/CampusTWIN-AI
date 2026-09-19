import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { VerdictBox, RecommendationList } from "../components/Recommendation";
import { runSimulation } from "../lib/simulator";
import { generateRecommendation } from "../lib/recommendation";
import { validateInputs, saveScenario } from "../lib/storage";
import {
  CampusBlock, CAMPUS_BLOCKS, EVENT_TYPES, EventType, ScenarioInput,
  SimulationResult, RecommendationResult,
} from "../lib/types";

interface ScenarioDef {
  name: string;
  inputs: ScenarioInput;
}

const DEFAULT_DEFS: ScenarioDef[] = [
  { name: "Scenario A", inputs: { num_students: 500, event_attendance: 100, time: "10:00", temperature: 28, campus_block: "Block A", event_type: "Lecture" } },
  { name: "Scenario B", inputs: { num_students: 800, event_attendance: 300, time: "14:00", temperature: 28, campus_block: "Block B", event_type: "Large Event" } },
  { name: "Scenario C", inputs: { num_students: 600, event_attendance: 150, time: "16:00", temperature: 28, campus_block: "Block C", event_type: "Workshop" } },
];

export function ComparisonPage() {
  const [defs, setDefs] = useState<ScenarioDef[]>(DEFAULT_DEFS);
  const [results, setResults] = useState<{ sim: SimulationResult; rec: RecommendationResult }[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const updateDef = (i: number, patch: Partial<ScenarioInput>) => {
    setDefs((prev) => prev.map((d, idx) => idx === i ? { ...d, inputs: { ...d.inputs, ...patch } } : d));
  };

  const runAll = () => {
    const errs: string[] = [];
    const res: { sim: SimulationResult; rec: RecommendationResult }[] = [];
    defs.forEach((d, i) => {
      const e = validateInputs(d.inputs);
      if (e.length > 0) errs.push(`${d.name}: ${e[0]}`);
      else {
        const sim = runSimulation(d.inputs);
        const rec = generateRecommendation(sim);
        saveScenario(d.name, d.inputs, sim.predictions, sim, rec);
        res.push({ sim, rec });
      }
    });
    setErrors(errs);
    setResults(res.length === defs.length ? res : null);
  };

  const times: string[] = [];
  for (let h = 6; h <= 22; h++) times.push(`${String(h).padStart(2, "0")}:00`);

  return (
    <div className="animate-fadeIn space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Scenario Comparison</h2>
        <p className="text-sm text-slate-500">Create scenarios, run them, and compare side-by-side.</p>
      </div>

      {/* Scenario editors */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {defs.map((d, i) => (
          <div key={d.name} className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-brand-700">{d.name}</h3>
            <div className="space-y-2.5">
              <div>
                <label className="text-xs text-slate-500">Students</label>
                <input type="number" min={0} max={2000} value={d.inputs.num_students}
                  onChange={(e) => updateDef(i, { num_students: parseInt(e.target.value, 10) || 0 })}
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Attendance</label>
                <input type="number" min={0} max={2000} value={d.inputs.event_attendance}
                  onChange={(e) => updateDef(i, { event_attendance: parseInt(e.target.value, 10) || 0 })}
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Location</label>
                <select value={d.inputs.campus_block}
                  onChange={(e) => updateDef(i, { campus_block: e.target.value as CampusBlock })}
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm">
                  {CAMPUS_BLOCKS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Time</label>
                <select value={d.inputs.time}
                  onChange={(e) => updateDef(i, { time: e.target.value })}
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm">
                  {times.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Event Type</label>
                <select value={d.inputs.event_type}
                  onChange={(e) => updateDef(i, { event_type: e.target.value as EventType })}
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm">
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Temperature: {d.inputs.temperature}°C</label>
                <input type="range" min={0} max={50} value={d.inputs.temperature}
                  onChange={(e) => updateDef(i, { temperature: parseInt(e.target.value, 10) })}
                  className="w-full accent-brand-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={runAll}
        className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Run All Scenarios
      </button>

      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 px-4 py-3">
          {errors.map((e, i) => <p key={i} className="text-sm text-red-700">⚠ {e}</p>)}
        </div>
      )}

      {results && (
        <>
          {/* Comparison table */}
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2">Scenario</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2 text-right">Occupancy</th>
                  <th className="px-3 py-2 text-right">Energy</th>
                  <th className="px-3 py-2 text-right">Utilization</th>
                  <th className="px-3 py-2 text-right">Congestion</th>
                  <th className="px-3 py-2">Stress</th>
                  <th className="px-3 py-2">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const k = r.sim.kpis;
                  return (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-700">{defs[i].name}</td>
                      <td className="px-3 py-2 text-slate-600">{r.sim.block}</td>
                      <td className="px-3 py-2 text-right">{Math.round(k.predicted_occupancy)}</td>
                      <td className="px-3 py-2 text-right">{Math.round(k.energy_demand)}</td>
                      <td className="px-3 py-2 text-right">{Math.round(k.room_utilization)}%</td>
                      <td className="px-3 py-2 text-right">{Math.round(k.predicted_congestion)}</td>
                      <td className="px-3 py-2">{k.resource_stress}</td>
                      <td className="px-3 py-2 text-xs">{r.rec.verdict}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Occupancy & Energy</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={results.map((r, i) => ({
                  name: defs[i].name,
                  Occupancy: Math.round(r.sim.kpis.predicted_occupancy),
                  Energy: Math.round(r.sim.kpis.energy_demand),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Occupancy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Energy" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Utilization & Congestion</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={results.map((r, i) => ({
                  name: defs[i].name,
                  Utilization: Math.round(r.sim.kpis.room_utilization),
                  Congestion: Math.round(r.sim.kpis.predicted_congestion),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Utilization" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Congestion" fill="#e67e22" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="mb-3 text-lg font-bold text-slate-800">Recommendations per Scenario</h3>
            <div className="space-y-4">
              {results.map((r, i) => (
                <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
                  <h4 className="mb-2 font-semibold text-slate-700">{defs[i].name}</h4>
                  <VerdictBox verdict={r.rec.verdict} />
                  <div className="mt-3">
                    <RecommendationList items={r.rec.recommendations} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            All scenarios run, compared and saved to history.
          </div>
        </>
      )}
    </div>
  );
}
