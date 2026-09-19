import { CampusBlock, EventType, ScenarioInput } from "../lib/types";
import { CAMPUS_BLOCKS, EVENT_TYPES } from "../lib/types";

interface ScenarioFormProps {
  values: ScenarioInput;
  onChange: (patch: Partial<ScenarioInput>) => void;
  keyPrefix: string;
}

export function ScenarioForm({ values, onChange, keyPrefix }: ScenarioFormProps) {
  const times: string[] = [];
  for (let h = 6; h <= 22; h++) times.push(`${String(h).padStart(2, "0")}:00`);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Number of students</label>
        <input
          type="number"
          min={0}
          max={2000}
          value={values.num_students}
          onChange={(e) => onChange({ num_students: parseInt(e.target.value, 10) || 0 })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Event attendance</label>
        <input
          type="number"
          min={0}
          max={2000}
          value={values.event_attendance}
          onChange={(e) => onChange({ event_attendance: parseInt(e.target.value, 10) || 0 })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Time</label>
        <select
          value={values.time}
          onChange={(e) => onChange({ time: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {times.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Temperature: {values.temperature}°C
        </label>
        <input
          type="range"
          min={0}
          max={50}
          value={values.temperature}
          onChange={(e) => onChange({ temperature: parseInt(e.target.value, 10) })}
          className="w-full accent-brand-600"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Campus location</label>
        <select
          value={values.campus_block}
          onChange={(e) => onChange({ campus_block: e.target.value as CampusBlock })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {CAMPUS_BLOCKS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Event type</label>
        <select
          value={values.event_type}
          onChange={(e) => onChange({ event_type: e.target.value as EventType })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
