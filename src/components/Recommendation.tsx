import { RecommendationItem } from "../lib/types";

const levelStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Critical: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500" },
  Warning: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
  OK: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
};

export function VerdictBox({ verdict }: { verdict: string }) {
  let cls = "bg-emerald-100 text-emerald-800";
  if (verdict.includes("Risky")) cls = "bg-red-100 text-red-800";
  else if (verdict.includes("Feasible")) cls = "bg-amber-100 text-amber-800";
  return (
    <div className={`rounded-xl px-4 py-3 text-base font-bold ${cls}`}>
      Decision Verdict: {verdict}
    </div>
  );
}

export function RecommendationList({ items }: { items: RecommendationItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((r, i) => {
        const st = levelStyles[r.level] || levelStyles.OK;
        const areaLabel = `[${r.area}] `;
        return (
          <div key={i} className={`rounded-lg px-3 py-2.5 ${st.bg}`}>
            <div className="flex items-start gap-2">
              <span className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${st.dot}`} />
              <div className="flex-1">
                <span className={`text-sm font-semibold ${st.text}`}>{areaLabel}</span>
                <span className="text-sm text-slate-700">{r.message}</span>
                <div className="mt-0.5 text-xs text-slate-400">Factor: {r.factor}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
