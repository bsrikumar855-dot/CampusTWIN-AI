import { clsx } from "clsx";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  state?: "ok" | "warn" | "crit";
}

const borderColors: Record<string, string> = {
  ok: "border-l-emerald-500",
  warn: "border-l-amber-500",
  crit: "border-l-red-500",
};

export function KPICard({ title, value, subtitle, state = "ok" }: KPICardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border-l-4 bg-white p-4 shadow-sm transition-all hover:shadow-md",
        borderColors[state]
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
      {subtitle && <div className="mt-0.5 text-xs text-slate-400">{subtitle}</div>}
    </div>
  );
}
