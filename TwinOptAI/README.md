# 🏗 TwinOpt AI

**AI-Powered What-If Simulator for Smart Campus Digital Twins**

> Before changing the real campus, test the decision in its Digital Twin.

TwinOpt AI is a web-based Smart Campus Digital Twin system that lets campus
administrators enter or modify campus conditions and simulate **what-if**
scenarios before implementing real-world decisions.

**Pipeline:** `Campus Data → Digital Twin → AI Prediction → What-If Scenario → Simulation → Option Comparison → Decision Recommendation`

**Decision flow:** `PREDICT → SIMULATE → COMPARE → OPTIMIZE → DECIDE`

## Problem Statement

Campus administrators routinely make decisions about scheduling events,
allocating rooms, and managing resources (energy, parking, canteen, staffing).
Poor decisions lead to overcrowding, energy spikes, parking chaos and
resource shortages. Testing decisions in the real campus is costly and
disruptive.

## Objectives

1. Build a virtual **Digital Twin** of a campus (blocks, classrooms,
   auditorium, library, parking, canteen).
2. Use **AI prediction models** to predict occupancy, energy demand and
   resource stress from campus conditions.
3. Provide a **What-If Simulator** where admins change inputs and instantly
   see predicted impact across the twin.
4. Allow **multiple scenarios** to be compared side-by-side.
5. Provide a **recommendation engine** that gives factor-based decision support.
6. Store every simulation in the browser and show a **Simulation History**.

## System Architecture

```
User Input (sidebar)
      │
      ▼
  Campus Data (synthetic model)  ──►  AI Prediction  ──►  Predictions
      │                                                      │
      ▼                                                      ▼
  Digital Twin (SVG map)  ◄────────  Simulator (what-if)
      │                                                      │
      ▼                                                      ▼
  KPI Cards / Charts  ◄────────  Comparison Table / Recommendation Engine
      │
      ▼
  localStorage (history)  ──►  History page
```

### Modules

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app shell with sidebar navigation & 7 pages |
| `src/lib/types.ts` | TypeScript types and campus location definitions |
| `src/lib/aiModel.ts` | AI prediction logic (occupancy, energy, stress) |
| `src/lib/digitalTwin.ts` | Virtual campus state builder |
| `src/lib/simulator.ts` | What-if simulation engine (KPIs, resources, traffic) |
| `src/lib/recommendation.ts` | Factor-based decision-support engine |
| `src/lib/storage.ts` | Input validation + localStorage scenario history |
| `src/components/` | KPI cards, campus map, tables, forms, recommendations |
| `src/pages/` | 7 dashboard pages |

## Technologies Used

- **React 18 + TypeScript** — UI framework
- **Vite** — build tool & dev server
- **Tailwind CSS** — styling
- **Recharts** — interactive charts
- **Lucide React** — icons
- **localStorage** — scenario & history persistence (no backend required)

## Installation

```bash
npm install
```

## How to Run

```bash
npm run dev
```

The app opens at `http://localhost:5173`.

## How to Build

```bash
npm run build
```

Produces a deployable static site in `dist/`.

## How AI Works

The prediction engine uses deterministic non-linear formulas that mirror the
patterns of trained Random Forest models:

- **Occupancy prediction** — combines students, event attendance, hour,
  temperature, capacity, block factor and event factor with non-linear
  interactions.
- **Energy demand prediction** — scales with occupancy, students, HVAC load
  (temperature deviation) and block-specific energy multipliers.
- **Resource stress classification** — Low / Medium / High based on resource
  availability (1 - utilization).

## How the Digital Twin Works

The campus has 7 locations (Block A/B/C, Auditorium, Library, Parking Area,
Canteen), each with capacity, coordinates, and live state (occupancy,
utilization, energy, stress). An interactive SVG map renders the twin; node
color reflects resource stress (green/amber/red) and node size scales with
utilization. High-stress locations pulse. When a scenario runs, spillover is
distributed to non-target locations so the whole campus responds realistically.

## How What-If Simulation Works

1. User enters: students, event attendance, time, temperature, location, event type.
2. Inputs are validated (non-negative, plausible ranges, valid location/time).
3. The AI models predict occupancy, energy and stress for the target location.
4. Spillover is computed for every other campus location.
5. KPIs are derived: occupancy, energy, utilization, congestion (traffic index),
   resource stress, extra seats/classrooms needed.
6. Resource estimates: required seats, classrooms, electricity, parking slots,
   canteen load, facility load %.
7. The recommendation engine evaluates each KPI against thresholds and emits
   factor-based advice with a verdict (Safe / Feasible / Risky).
8. The scenario can be saved to localStorage history.

## Demo Scenario

Click **"Load Demo Scenario"** on the What-If Simulator page, then **"Simulate"**:

| Input | Value |
|-------|-------|
| Students | 800 |
| Event attendance | 300 |
| Location | Block B |
| Time | 14:00 |
| Temperature | 32 °C |
| Event type | Large Event |

The dashboard shows predicted occupancy, energy demand, room utilization,
traffic/congestion, resource stress, resource estimates and AI decision support.

## Dashboard Pages

| Page | Contents |
|------|----------|
| Home | Project overview, pipeline, current campus status |
| Digital Twin | Interactive campus map, per-location details, utilization/energy charts |
| AI Prediction | Input conditions, predictions, charts, model metrics |
| What-If Simulator | Scenario creation, demo button, KPI cards, decision support |
| Scenario Comparison | 3 scenarios side-by-side, comparison table & charts |
| Optimization | Resource analysis, facility load gauge, recommendations |
| History | Previous simulations, detail view, delete/clear |

## KPI Cards

- Predicted Occupancy
- Energy Demand
- Room Utilization
- Resource Stress
- Predicted Congestion
- Resource Requirement (extra seats)

## Future Enhancements

- Live IoT sensor integration for real-time data
- 3D campus visualization
- Time-series forecasting (next 24h)
- Multi-campus / multi-tenant support
- Automatic schedule optimization
- Export reports (PDF/Excel)
- User authentication & role-based access

---

*Built for a college hackathon demonstration.*
