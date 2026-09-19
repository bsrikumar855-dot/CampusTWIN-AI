import { useEffect, useState } from "react";
import { VerdictBox, RecommendationList } from "../components/Recommendation";
import { clearHistory, deleteScenario, getHistory } from "../lib/storage";
import { SavedScenario } from "../lib/types";

export function HistoryPage() {
  const [history, setHistory] = useState<SavedScenario[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const refresh = () => {
    const h = getHistory();
    setHistory(h);
    setSelectedId(h.length > 0 ? h[0].id : null);
  };

  useEffect(() => { refresh(); }, []);

  const selected = history.find((h) => h.id === selectedId);

  const handleDelete = (id: number) => {
    deleteScenario(id);
    refresh();
  };

  const handleClear = () => {
    clearHistory();
    refresh();
  };

  if (history.length === 0) {
    return (
      <div className="animate-fadeIn">
        <h2 className="text-2xl font-bold text-slate-800">Simulation History</h2>
        <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-slate-400">
          No saved simulations yet. Run a scenario from the What-If Simulator or Scenario Comparison pages.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Simulation History</h2>
        <button
          onClick={handleClear}
          className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-200"
        >
          Clear All History
        </button>
      </div>

      {/* Summary table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2 text-right">Students</th>
              <th className="px-3 py-2 text-right">Attendance</th>
              <th className="px-3 py-2 text-right">Occupancy</th>
              <th className="px-3 py-2 text-right">Energy</th>
              <th className="px-3 py-2 text-right">Util %</th>
              <th className="px-3 py-2 text-right">Congestion</th>
              <th className="px-3 py-2">Stress</th>
              <th className="px-3 py-2">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => {
              const k = h.simulation.kpis;
              return (
                <tr
                  key={h.id}
                  onClick={() => setSelectedId(h.id)}
                  className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${selectedId === h.id ? "bg-brand-50" : ""}`}
                >
                  <td className="px-3 py-2 text-slate-400">#{h.id}</td>
                  <td className="px-3 py-2 font-medium text-slate-700">{h.scenario_name}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{h.created_at}</td>
                  <td className="px-3 py-2 text-slate-600">{h.simulation.block}</td>
                  <td className="px-3 py-2 text-right">{h.inputs.num_students}</td>
                  <td className="px-3 py-2 text-right">{h.inputs.event_attendance}</td>
                  <td className="px-3 py-2 text-right">{Math.round(k.predicted_occupancy)}</td>
                  <td className="px-3 py-2 text-right">{Math.round(k.energy_demand)}</td>
                  <td className="px-3 py-2 text-right">{Math.round(k.room_utilization)}%</td>
                  <td className="px-3 py-2 text-right">{Math.round(k.predicted_congestion)}</td>
                  <td className="px-3 py-2">{k.resource_stress}</td>
                  <td className="px-3 py-2 text-xs">{h.recommendation.verdict}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail view */}
      {selected && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">
            Detail: #{selected.id} {selected.scenario_name}
          </h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Inputs</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-slate-500">Students</dt><dd className="text-right">{selected.inputs.num_students}</dd>
                <dt className="text-slate-500">Attendance</dt><dd className="text-right">{selected.inputs.event_attendance}</dd>
                <dt className="text-slate-500">Time</dt><dd className="text-right">{selected.inputs.time}</dd>
                <dt className="text-slate-500">Temperature</dt><dd className="text-right">{selected.inputs.temperature}°C</dd>
                <dt className="text-slate-500">Location</dt><dd className="text-right">{selected.inputs.campus_block}</dd>
                <dt className="text-slate-500">Event Type</dt><dd className="text-right">{selected.inputs.event_type}</dd>
              </dl>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Resource Estimates</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-slate-500">Required Seats</dt><dd className="text-right">{selected.simulation.resource_estimates.required_seats}</dd>
                <dt className="text-slate-500">Required Classrooms</dt><dd className="text-right">{selected.simulation.resource_estimates.required_classrooms}</dd>
                <dt className="text-slate-500">Electricity</dt><dd className="text-right">{selected.simulation.resource_estimates.required_electricity_kwh} kWh</dd>
                <dt className="text-slate-500">Parking</dt><dd className="text-right">{selected.simulation.resource_estimates.parking_requirement} slots</dd>
                <dt className="text-slate-500">Canteen Load</dt><dd className="text-right">{selected.simulation.resource_estimates.canteen_load}</dd>
                <dt className="text-slate-500">Facility Load</dt><dd className="text-right">{selected.simulation.resource_estimates.facility_load_pct}%</dd>
              </dl>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h4 className="mb-2 text-sm font-semibold text-slate-700">Recommendations</h4>
            <VerdictBox verdict={selected.recommendation.verdict} />
            <div className="mt-3">
              <RecommendationList items={selected.recommendation.recommendations} />
            </div>
          </div>
          <button
            onClick={() => handleDelete(selected.id)}
            className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200"
          >
            Delete this record
          </button>
        </div>
      )}
    </div>
  );
}
