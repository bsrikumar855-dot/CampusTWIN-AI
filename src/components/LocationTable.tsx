import { CampusBlock, LocationState } from "../lib/types";
import { STRESS_COLOR } from "../lib/digitalTwin";

interface LocationTableProps {
  state: Record<CampusBlock, LocationState>;
  showPredicted?: boolean;
}

export function LocationTable({ state, showPredicted = false }: LocationTableProps) {
  const names = Object.keys(state) as CampusBlock[];
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <th className="px-3 py-2">Location</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2 text-right">Capacity</th>
            <th className="px-3 py-2 text-right">Occupancy</th>
            {showPredicted && <th className="px-3 py-2 text-right">Predicted</th>}
            <th className="px-3 py-2 text-right">Util %</th>
            <th className="px-3 py-2 text-right">Energy</th>
            <th className="px-3 py-2">Stress</th>
          </tr>
        </thead>
        <tbody>
          {names.map((name) => {
            const s = state[name];
            return (
              <tr key={name} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-700">{name}</td>
                <td className="px-3 py-2 text-slate-500">{s.type}</td>
                <td className="px-3 py-2 text-right text-slate-600">{s.capacity}</td>
                <td className="px-3 py-2 text-right text-slate-600">{s.current_occupancy}</td>
                {showPredicted && <td className="px-3 py-2 text-right text-slate-600">{s.predicted_occupancy}</td>}
                <td className="px-3 py-2 text-right text-slate-600">{s.utilization}%</td>
                <td className="px-3 py-2 text-right text-slate-600">{s.energy_demand}</td>
                <td className="px-3 py-2">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: STRESS_COLOR[s.resource_stress] }}
                  >
                    {s.resource_stress}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
