import { useMemo, useState } from "react";
import {
  Home, Map, Brain, FlaskConical, Scale, Settings, History, GraduationCap,
} from "lucide-react";
import { ScenarioForm } from "./components/ScenarioForm";
import { HomePage } from "./pages/HomePage";
import { DigitalTwinPage } from "./pages/DigitalTwinPage";
import { AIPredictionPage } from "./pages/AIPredictionPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { ComparisonPage } from "./pages/ComparisonPage";
import { OptimizationPage } from "./pages/OptimizationPage";
import { HistoryPage } from "./pages/HistoryPage";
import { runSimulation } from "./lib/simulator";
import { generateRecommendation } from "./lib/recommendation";
import { ScenarioInput, SimulationResult, RecommendationResult } from "./lib/types";

type PageId = "home" | "twin" | "ai" | "simulator" | "comparison" | "optimization" | "history";

const NAV_ITEMS: { id: PageId; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "twin", label: "Digital Twin", icon: Map },
  { id: "ai", label: "AI Prediction", icon: Brain },
  { id: "simulator", label: "What-If Simulator", icon: FlaskConical },
  { id: "comparison", label: "Scenario Comparison", icon: Scale },
  { id: "optimization", label: "Optimization", icon: Settings },
  { id: "history", label: "History", icon: History },
];

const DEFAULT_INPUTS: ScenarioInput = {
  num_students: 600,
  event_attendance: 150,
  time: "14:00",
  temperature: 28,
  campus_block: "Block B",
  event_type: "Large Event",
};

export default function App() {
  const [page, setPage] = useState<PageId>("home");
  const [inputs, setInputs] = useState<ScenarioInput>(DEFAULT_INPUTS);
  const [lastSim, setLastSim] = useState<SimulationResult | null>(null);
  const [lastRec, setLastRec] = useState<RecommendationResult | null>(null);

  const handleInputChange = (patch: Partial<ScenarioInput>) => {
    setInputs((prev) => ({ ...prev, ...patch }));
  };

  // Keep lastSim updated when inputs change on pages that auto-run
  const autoSim = useMemo(() => runSimulation(inputs), [inputs]);
  const autoRec = useMemo(() => generateRecommendation(autoSim), [autoSim]);

  // The simulator page sets lastSim explicitly on "Simulate" button click
  // For Optimization page, use lastSim if set, else fall back to autoSim
  const optSim = lastSim || autoSim;
  const optRec = lastRec || autoRec;

  const showSidebarInputs = page === "twin" || page === "ai" || page === "simulator";

  const renderPage = () => {
    switch (page) {
      case "home": return <HomePage />;
      case "twin": return <DigitalTwinPage inputs={inputs} onChange={handleInputChange} />;
      case "ai": return <AIPredictionPage inputs={inputs} />;
      case "simulator":
        return (
          <SimulatorPage
            inputs={inputs}
            onChange={handleInputChange}
          />
        );
      case "comparison": return <ComparisonPage />;
      case "optimization": return <OptimizationPage sim={optSim} rec={optRec} />;
      case "history": return <HistoryPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4">
          <GraduationCap className="h-7 w-7 text-brand-600" />
          <div>
            <div className="text-base font-extrabold text-slate-800">TwinOpt AI</div>
            <div className="text-[10px] text-slate-400">What-If Campus Simulator</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Scenario inputs in sidebar */}
        {showSidebarInputs && (
          <div className="border-t border-slate-200 px-3 py-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Scenario Inputs
            </div>
            <ScenarioForm values={inputs} onChange={handleInputChange} keyPrefix="sidebar" />
          </div>
        )}

        <div className="border-t border-slate-200 px-4 py-3 text-[10px] text-slate-400">
          PREDICT → SIMULATE → COMPARE → OPTIMIZE → DECIDE
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-6 py-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
