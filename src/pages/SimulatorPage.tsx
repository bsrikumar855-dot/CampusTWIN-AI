import { useState } from "react";
import { KPICard } from "../components/KPICard";
import { CampusMap } from "../components/CampusMap";
import { VerdictBox, RecommendationList } from "../components/Recommendation";
import { runSimulation } from "../lib/simulator";
import { generateRecommendation } from "../lib/recommendation";
import { validateInputs, saveScenario } from "../lib/storage";
import { ScenarioInput } from "../lib/types";

interface Props {
  inputs: ScenarioInput;
  onChange: (patch: Partial<ScenarioInput>) => void;
}

export function SimulatorPage({ inputs, onChange }: Props) {
  const [result, setResult] = useState<ReturnType<typeof runSimulation> | null>(null);
  const [rec, setRec] = useState<ReturnType<typeof generateRecommendation> | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [scenarioName, setScenarioName] = useState("Scenario 1");
  const [saved, setSaved] = useState(false);

  const handleSimulate = () => {
    const errs = validateInputs(inputs);
    setErrors(errs);
    if (errs.length > 0) return;
    const sim = runSimulation(inputs);
    const r = generateRecommendation(sim);
    setResult(sim);
    setRec(r);
    setSaved(false);
  };

  const handleSave = () => {
    if (!result || !rec) return;
    saveScenario(scenarioName, inputs, result.predictions, result, rec);
    setSaved(true);
  };

  const handleDemo = () => {
    onChange({
      num_students: 800,
      event_attendance: 300,
      time: "14:00",
      temperature: 32,
      campus_block: "Block B",
      event_type: "Large Event",
    });
    setErrors([]);
    // Simulate after loading demo — use the demo values directly
    const demoInputs = {
      num_students: 800,
      event_attendance: 300,
      time: "14:00",
      temperature: 32,
      campus_block: "Block B" as const,
      event_type: "Large Event" as const,
    };
    const sim = runSimulation(demoInputs);
    const r = generateRecommendation(sim);
    setResult(sim);
    setRec(r);
    setSaved(false);
  };

  const k = result?.kpis;

  return (
    <div className="animate-fadeIn space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">What-If Simulator</h2>
          <p className="text-sm text-slate-500">Test a future campus decision and instantly see its impact.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDemo}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Load Demo Scenario
          </button>
          <button
            onClick={handleSimulate}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Simulate
          </button>
        </div>
      </div>

      {/* Scenario name */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600">Scenario name:</label>
        <input
          type="text"
          value={scenarioName}
          onChange={(e) => { setScenarioName(e.target.value); setSaved(false); }}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {result && (
          <button
            onClick={handleSave}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-600"
          >
            {saved ? "Saved ✓" : "Save to History"}
          </button>
        )}
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 px-4 py-3">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-red-700">⚠ {e}</p>
          ))}
        </div>
      )}

      {result && k && (
        <>
          <div>
            <h3 className="mb-3 text-lg font-bold text-slate-800">KPI Cards</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <KPICard title="Predicted Occupancy" value={Math.round(k.predicted_occupancy)} />
              <KPICard title="Energy Demand" value={`${Math.round(k.energy_demand)} kWh`} />
              <KPICard title="Room Utilization" value={`${Math.round(k.room_utilization)}%`} />
              <KPICard
                title="Resource Stress"
                value={k.resource_stress}
                state={k.resource_stress === "High" ? "crit" : k.resource_stress === "Medium" ? "warn" : "ok"}
              />
              <KPICard title="Predicted Congestion" value={`${Math.round(k.predicted_congestion)}/100`} state={k.predicted_congestion >= 70 ? "crit" : k.predicted_congestion >= 40 ? "warn" : "ok"} />
              <KPICard title="Extra Seats Needed" value={k.resource_requirement.extra_seats} state={k.resource_requirement.extra_seats > 0 ? "crit" : "ok"} />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-bold text-slate-800">Digital Campus Response</h3>
            <CampusMap state={result.twin_state} />
          </div>

          {rec && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-800">AI Decision Support</h3>
              <VerdictBox verdict={rec.verdict} />
              <RecommendationList items={rec.recommendations} />
            </div>
          )}
        </>
      )}

      {!result && errors.length === 0 && (
        <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-400">
          Adjust the scenario inputs in the sidebar, then press <strong className="text-slate-600">Simulate</strong> to see the impact.
        </div>
      )}
    </div>
  );
}
