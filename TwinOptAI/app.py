"""TwinOpt AI - AI-Powered What-If Simulator for Smart Campus Digital Twins.

Streamlit dashboard. Run with: streamlit run app.py
"""
import os
import sys

# Ensure local modules import correctly when run from any cwd
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
import plotly.graph_objects as go

import streamlit as st

import database as db
import data_generator
from ai_model import load_models, CAMPUS_BLOCKS, EVENT_TYPES
from digital_twin import (campus_visualization, utilization_bar_chart,
                          energy_bar_chart, default_twin_state, CAMPUS_LOCATIONS)
from simulator import run_simulation
from recommendation import generate_recommendation

# ----------------------------------------------------------------------------
# Page config & theming
# ----------------------------------------------------------------------------
st.set_page_config(
    page_title="TwinOpt AI",
    page_icon="🏫",
    layout="wide",
    initial_sidebar_state="expanded",
)

CUSTOM_CSS = """
<style>
    .main { background-color: #f7f9fc; }
    .kpi-card {
        background: linear-gradient(135deg, #ffffff 0%, #eef2f7 100%);
        border-radius: 14px; padding: 18px 20px; margin-bottom: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 5px solid #2563eb;
    }
    .kpi-card.warn { border-left-color: #f39c12; }
    .kpi-card.crit { border-left-color: #e74c3c; }
    .kpi-card.ok   { border-left-color: #27ae60; }
    .kpi-title { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing:0.5px; }
    .kpi-value { font-size: 26px; font-weight: 700; color: #1e293b; margin-top:4px; }
    .kpi-sub   { font-size: 12px; color: #94a3b8; margin-top:2px; }
    .section-header { font-size:20px; font-weight:700; color:#1e293b; margin: 10px 0 6px 0; }
    .verdict-box { border-radius:12px; padding:14px 18px; font-weight:600; font-size:16px; }
    .verdict-safe { background:#dcfce7; color:#166534; }
    .verdict-warn { background:#fef9c3; color:#854d0e; }
    .verdict-risk { background:#fee2e2; color:#991b1b; }
    .scenario-card {
        background:#fff; border-radius:12px; padding:14px; margin-bottom:10px;
        box-shadow:0 1px 4px rgba(0,0,0,0.07); border-top:4px solid #2563eb;
    }
    div[data-testid="stMetric"] { background:#fff; border-radius:10px; padding:10px; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


# ----------------------------------------------------------------------------
# Initialization (runs once)
# ----------------------------------------------------------------------------
@st.cache_resource
def init_all():
    data_generator.ensure_data()
    db.init_db()
    bundle = load_models()
    return bundle


def kpi_card(title, value, sub="", state="ok"):
    cls = "kpi-card " + state
    st.markdown(
        f"<div class='{cls}'>"
        f"<div class='kpi-title'>{title}</div>"
        f"<div class='kpi-value'>{value}</div>"
        f"<div class='kpi-sub'>{sub}</div>"
        f"</div>", unsafe_allow_html=True)


def stress_state(stress):
    return {"High": "crit", "Medium": "warn", "Low": "ok"}.get(stress, "ok")


def stress_color(stress):
    return {"High": "#e74c3c", "Medium": "#f39c12", "Low": "#27ae60"}.get(stress, "#3498db")


def verdict_box(verdict):
    if "Safe" in verdict:
        cls = "verdict-box verdict-safe"
    elif "Feasible" in verdict:
        cls = "verdict-box verdict-warn"
    else:
        cls = "verdict-box verdict-risk"
    st.markdown(f"<div class='{cls}'>Decision Verdict: {verdict}</div>", unsafe_allow_html=True)


# ----------------------------------------------------------------------------
# Sidebar navigation
# ----------------------------------------------------------------------------
st.sidebar.markdown("## 🏫 TwinOpt AI")
st.sidebar.caption("AI-Powered What-If Simulator for Smart Campus Digital Twin")

PAGES = ["Home", "Digital Twin", "AI Prediction", "What-If Simulator",
         "Scenario Comparison", "Optimization", "History"]
page = st.sidebar.radio("Navigation", PAGES)

bundle = init_all()

# Shared session state for scenarios
if "scenarios" not in st.session_state:
    st.session_state.scenarios = {}  # name -> sim result
if "last_sim" not in st.session_state:
    st.session_state.last_sim = None


def scenario_inputs_sidebar(key_prefix="s"):
    """Sidebar input widget group used across pages."""
    with st.sidebar.expander("Scenario Inputs", expanded=True):
        num_students = st.number_input("Number of students", 0, 2000, 600, key=f"{key_prefix}_ns")
        event_attendance = st.number_input("Event attendance", 0, 2000, 150, key=f"{key_prefix}_ea")
        time = st.time_input("Time", value=pd.to_datetime("14:00").time(), key=f"{key_prefix}_time")
        temperature = st.slider("Temperature (°C)", 0, 50, 28, key=f"{key_prefix}_temp")
        campus_block = st.selectbox("Campus location", CAMPUS_BLOCKS, key=f"{key_prefix}_block")
        event_type = st.selectbox("Event type", EVENT_TYPES, index=4, key=f"{key_prefix}_etype")
    return {
        "num_students": int(num_students),
        "event_attendance": int(event_attendance),
        "time": time.strftime("%H:%M"),
        "temperature": float(temperature),
        "campus_block": campus_block,
        "event_type": event_type,
    }


def validate_inputs(inputs):
    errors = []
    if inputs["num_students"] < 0:
        errors.append("Number of students cannot be negative.")
    if inputs["num_students"] > 2000:
        errors.append("Number of students exceeds reasonable limit (2000).")
    if inputs["event_attendance"] < 0:
        errors.append("Event attendance cannot be negative.")
    if inputs["event_attendance"] > inputs["num_students"] + 500:
        errors.append("Event attendance is unrealistically high vs. student count.")
    try:
        h = int(str(inputs["time"]).split(":")[0])
        if h < 6 or h > 22:
            errors.append("Time should be between 06:00 and 22:00.")
    except Exception:
        errors.append("Invalid time format.")
    if inputs["campus_block"] not in CAMPUS_BLOCKS:
        errors.append("Invalid campus location.")
    if not (0 <= inputs["temperature"] <= 55):
        errors.append("Temperature out of plausible range (0-55°C).")
    return errors


# ============================================================================
# PAGE: HOME
# ============================================================================
if page == "Home":
    st.markdown("<h1 style='color:#1e293b'>🏫 TwinOpt AI</h1>", unsafe_allow_html=True)
    st.markdown("#### AI-Powered What-If Simulator for Smart Campus Digital Twin")
    st.markdown(
        "Before changing the real campus, test the decision in its Digital Twin. "
        "Predict occupancy, energy, congestion and resource stress for any "
        "what-if scenario, then compare options and get decision support."
    )

    st.markdown("---")
    st.markdown("### 🔄 System Pipeline")
    cols = st.columns(7)
    steps = ["Campus Data", "Digital Twin", "AI Prediction", "What-If Scenario",
             "Simulation", "Comparison", "Decision"]
    for c, s in zip(cols, steps):
        c.markdown(f"<div style='text-align:center; background:#2563eb; color:#fff; "
                   f"border-radius:8px; padding:10px 4px; font-weight:600; font-size:12px'>{s}</div>",
                   unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("### 📊 Current Campus Status")
    state = default_twin_state()
    c1, c2, c3, c4 = st.columns(4)
    total_occ = sum(s["current_occupancy"] for s in state.values())
    total_energy = round(sum(s["energy_demand"] for s in state.values()), 2)
    avg_util = round(sum(s["utilization"] for s in state.values()) / len(state), 1)
    high_stress = sum(1 for s in state.values() if s["resource_stress"] == "High")
    c1.metric("Total Occupancy", f"{total_occ}")
    c2.metric("Total Energy", f"{total_energy} kWh")
    c3.metric("Avg Utilization", f"{avg_util}%")
    c4.metric("High-Stress Zones", f"{high_stress}")

    st.plotly_chart(campus_visualization(state), use_container_width=True)

    with st.expander("Project Overview"):
        st.markdown("""
TwinOpt AI lets campus administrators simulate future campus conditions before
implementing real-world decisions. Enter a what-if scenario (students, event,
location, time, temperature) and the AI predicts occupancy, energy demand,
room utilization, traffic congestion and resource stress across a virtual
digital twin of the campus.

**Workflow:** PREDICT → SIMULATE → COMPARE → OPTIMIZE → DECIDE
        """)

# ============================================================================
# PAGE: DIGITAL TWIN
# ============================================================================
elif page == "Digital Twin":
    st.markdown("<h2 style='color:#1e293b'>🧭 Digital Twin</h2>", unsafe_allow_html=True)
    st.markdown("Interactive virtual representation of the campus. Adjust the inputs "
                "in the sidebar to see how each location responds.")
    inputs = scenario_inputs_sidebar("dt")
    errors = validate_inputs(inputs)
    if errors:
        for e in errors:
            st.error(e)

    sim = run_simulation(bundle, inputs)
    st.session_state.last_sim = sim
    state = sim["twin_state"]

    left, right = st.columns([3, 2])
    with left:
        st.plotly_chart(campus_visualization(state), use_container_width=True)
    with right:
        st.markdown("### Location Details")
        rows = []
        for name, s in state.items():
            rows.append({
                "Location": name,
                "Type": s["type"],
                "Capacity": s["capacity"],
                "Occupancy": s["current_occupancy"],
                "Utilization %": s["utilization"],
                "Energy (kWh)": s["energy_demand"],
                "Stress": s["resource_stress"],
            })
        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    st.markdown("---")
    c1, c2 = st.columns(2)
    with c1:
        st.plotly_chart(utilization_bar_chart(state), use_container_width=True)
    with c2:
        st.plotly_chart(energy_bar_chart(state), use_container_width=True)

# ============================================================================
# PAGE: AI PREDICTION
# ============================================================================
elif page == "AI Prediction":
    st.markdown("<h2 style='color:#1e293b'>🤖 AI Prediction</h2>", unsafe_allow_html=True)
    st.markdown("Enter future conditions; the trained ML models predict campus outcomes.")
    inputs = scenario_inputs_sidebar("ai")
    errors = validate_inputs(inputs)
    if errors:
        for e in errors:
            st.error(e)
    else:
        sim = run_simulation(bundle, inputs)
        st.session_state.last_sim = sim
        k = sim["kpis"]

        c1, c2, c3 = st.columns(3)
        c1.metric("Predicted Occupancy", f"{k['predicted_occupancy']:.0f}")
        c2.metric("Energy Demand", f"{k['energy_demand']:.0f} kWh")
        c3.metric("Resource Stress", k["resource_stress"])

        st.markdown("### Prediction Breakdown by Location")
        rows = []
        for name, s in sim["twin_state"].items():
            rows.append({
                "Location": name, "Capacity": s["capacity"],
                "Predicted Occupancy": s["predicted_occupancy"],
                "Utilization %": s["utilization"],
                "Energy (kWh)": s["energy_demand"], "Stress": s["resource_stress"],
            })
        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

        # Prediction chart
        names = list(sim["twin_state"].keys())
        fig = go.Figure()
        fig.add_trace(go.Bar(name="Predicted Occupancy", x=names,
                             y=[sim["twin_state"][n]["predicted_occupancy"] for n in names]))
        fig.add_trace(go.Bar(name="Capacity", x=names,
                             y=[sim["twin_state"][n]["capacity"] for n in names]))
        fig.update_layout(barmode="group", title="Predicted Occupancy vs Capacity",
                          height=360)
        st.plotly_chart(fig, use_container_width=True)

        st.info("Model metrics — " +
                f"Occupancy MAE: {bundle['metrics']['occupancy_mae']}, "
                f"Energy MAE: {bundle['metrics']['energy_mae']}, "
                f"Stress Accuracy: {bundle['metrics']['stress_accuracy']}")

# ============================================================================
# PAGE: WHAT-IF SIMULATOR
# ============================================================================
elif page == "What-If Simulator":
    st.markdown("<h2 style='color:#1e293b'>🧪 What-If Simulator</h2>", unsafe_allow_html=True)
    st.markdown("Test a future campus decision and instantly see its impact.")
    inputs = scenario_inputs_sidebar("wf")

    cA, cB = st.columns(2)
    with cA:
        if st.button("⭐ Load Demo Scenario"):
            st.session_state.wf_ns = 800
            st.session_state.wf_ea = 300
            st.session_state.wf_block = "Block B"
            st.session_state.wf_time = pd.to_datetime("14:00").time()
            st.session_state.wf_temp = 32
            st.session_state.wf_etype = "Large Event"
            st.rerun()
    with cB:
        scenario_name = st.text_input("Scenario name", value="Scenario 1", key="wf_name")
        run = st.button("🚀 Simulate")

    if run:
        errors = validate_inputs(inputs)
        if errors:
            for e in errors:
                st.error(e)
        else:
            sim = run_simulation(bundle, inputs)
            rec = generate_recommendation(sim)
            st.session_state.last_sim = sim

            # Save to DB
            db.save_scenario(scenario_name, inputs, sim["predictions"], sim, rec)
            st.session_state.scenarios[scenario_name] = sim

            k = sim["kpis"]
            st.markdown("---")
            st.markdown("### KPI Cards")
            cols = st.columns(3)
            cols[0].metric("Predicted Occupancy", f"{k['predicted_occupancy']:.0f}")
            cols[1].metric("Energy Demand", f"{k['energy_demand']:.0f} kWh")
            cols[2].metric("Room Utilization", f"{k['room_utilization']:.0f}%")
            cols2 = st.columns(3)
            cols2[0].metric("Resource Stress", k["resource_stress"])
            cols2[1].metric("Predicted Congestion", f"{k['predicted_congestion']:.0f}/100")
            cols2[2].metric("Extra Seats Needed", k["resource_requirement"]["extra_seats"])

            st.markdown("### Digital Campus Response")
            st.plotly_chart(campus_visualization(sim["twin_state"]), use_container_width=True)

            st.markdown("### AI Decision Support")
            verdict_box(rec["verdict"])
            for r in rec["recommendations"]:
                icon = {"Critical": "🔴", "Warning": "🟠", "OK": "🟢"}.get(r["level"], "⚪")
                st.markdown(f"{icon} **[{r['area']}]** {r['message']}  ")
                st.caption(f"Factor: {r['factor']}")

            st.success(f"Simulation complete for {scenario_name}. Saved to history.")

    elif st.session_state.last_sim:
        st.info("Press **Simulate** to run a new scenario. Last result is still available on the Optimization page.")

# ============================================================================
# PAGE: SCENARIO COMPARISON
# ============================================================================
elif page == "Scenario Comparison":
    st.markdown("<h2 style='color:#1e293b'>⚖️ Scenario Comparison</h2>", unsafe_allow_html=True)
    st.markdown("Create up to several scenarios, run them, and compare side-by-side.")

    with st.form("compare_form"):
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown("#### Scenario A")
            a_ns = st.number_input("Students A", 0, 2000, 500, key="cmpA_ns")
            a_ea = st.number_input("Attendance A", 0, 2000, 100, key="cmpA_ea")
            a_block = st.selectbox("Location A", CAMPUS_BLOCKS, key="cmpA_block")
            a_time = st.time_input("Time A", value=pd.to_datetime("10:00").time(), key="cmpA_time")
            a_etype = st.selectbox("Event A", EVENT_TYPES, index=1, key="cmpA_etype")
        with c2:
            st.markdown("#### Scenario B")
            b_ns = st.number_input("Students B", 0, 2000, 800, key="cmpB_ns")
            b_ea = st.number_input("Attendance B", 0, 2000, 300, key="cmpB_ea")
            b_block = st.selectbox("Location B", CAMPUS_BLOCKS, index=1, key="cmpB_block")
            b_time = st.time_input("Time B", value=pd.to_datetime("14:00").time(), key="cmpB_time")
            b_etype = st.selectbox("Event B", EVENT_TYPES, index=4, key="cmpB_etype")
        with c3:
            st.markdown("#### Scenario C")
            cc_ns = st.number_input("Students C", 0, 2000, 600, key="cmpC_ns")
            cc_ea = st.number_input("Attendance C", 0, 2000, 150, key="cmpC_ea")
            cc_block = st.selectbox("Location C", CAMPUS_BLOCKS, index=2, key="cmpC_block")
            cc_time = st.time_input("Time C", value=pd.to_datetime("16:00").time(), key="cmpC_time")
            cc_etype = st.selectbox("Event C", EVENT_TYPES, index=2, key="cmpC_etype")

        temp = st.slider("Temperature (°C) for all scenarios", 0, 50, 28, key="cmp_temp")
        submitted = st.form_submit_button("🚀 Run All Scenarios")

    if submitted:
        scen_defs = [
            ("Scenario A", {"num_students": a_ns, "event_attendance": a_ea, "time": a_time.strftime("%H:%M"),
                            "temperature": float(temp), "campus_block": a_block, "event_type": a_etype}),
            ("Scenario B", {"num_students": b_ns, "event_attendance": b_ea, "time": b_time.strftime("%H:%M"),
                            "temperature": float(temp), "campus_block": b_block, "event_type": b_etype}),
            ("Scenario C", {"num_students": cc_ns, "event_attendance": cc_ea, "time": cc_time.strftime("%H:%M"),
                            "temperature": float(temp), "campus_block": cc_block, "event_type": cc_etype}),
        ]
        results = []
        for name, inp in scen_defs:
            errs = validate_inputs(inp)
            if errs:
                st.error(f"{name}: {errs[0]}")
                continue
            sim = run_simulation(bundle, inp)
            rec = generate_recommendation(sim)
            db.save_scenario(name, inp, sim["predictions"], sim, rec)
            st.session_state.scenarios[name] = sim
            results.append((name, sim, rec))

        if results:
            # Comparison table
            st.markdown("### Comparison Table")
            rows = []
            for name, sim, _ in results:
                k = sim["kpis"]
                rows.append({
                    "Scenario": name,
                    "Location": sim["block"],
                    "Occupancy": round(k["predicted_occupancy"]),
                    "Energy (kWh)": round(k["energy_demand"]),
                    "Utilization %": round(k["room_utilization"]),
                    "Congestion": round(k["predicted_congestion"]),
                    "Stress": k["resource_stress"],
                    "Verdict": rec["verdict"],
                })
            df = pd.DataFrame(rows)
            st.dataframe(df, use_container_width=True, hide_index=True)

            # Charts
            names = [r[0] for r in results]
            c1, c2 = st.columns(2)
            with c1:
                fig = go.Figure()
                fig.add_trace(go.Bar(name="Occupancy", x=names,
                                     y=[r[1]["kpis"]["predicted_occupancy"] for r in results]))
                fig.add_trace(go.Bar(name="Energy", x=names,
                                     y=[r[1]["kpis"]["energy_demand"] for r in results]))
                fig.update_layout(barmode="group", title="Occupancy & Energy", height=320)
                st.plotly_chart(fig, use_container_width=True)
            with c2:
                fig2 = go.Figure()
                fig2.add_trace(go.Bar(name="Utilization %", x=names,
                                      y=[r[1]["kpis"]["room_utilization"] for r in results],
                                      marker_color="#9b59b6"))
                fig2.add_trace(go.Bar(name="Congestion", x=names,
                                      y=[r[1]["kpis"]["predicted_congestion"] for r in results],
                                      marker_color="#e67e22"))
                fig2.update_layout(barmode="group", title="Utilization & Congestion", height=320)
                st.plotly_chart(fig2, use_container_width=True)

            # Recommendation per scenario
            st.markdown("### Recommendations per Scenario")
            for name, sim, rec in results:
                with st.expander(f"{name} — {rec['verdict']}"):
                    for r in rec["recommendations"]:
                        icon = {"Critical": "🔴", "Warning": "🟠", "OK": "🟢"}.get(r["level"], "⚪")
                        st.markdown(f"{icon} **[{r['area']}]** {r['message']}")
                        st.caption(f"Factor: {r['factor']}")
            st.success("All scenarios run, compared and saved to history.")

    # Show previously stored scenarios from this session
    if st.session_state.scenarios:
        st.markdown("### Session Scenarios")
        for name, sim in st.session_state.scenarios.items():
            st.markdown(f"**{name}** — {sim['block']} | Occ {sim['kpis']['predicted_occupancy']:.0f} | "
                        f"Energy {sim['kpis']['energy_demand']:.0f} | Stress {sim['kpis']['resource_stress']}")

# ============================================================================
# PAGE: OPTIMIZATION
# ============================================================================
elif page == "Optimization":
    st.markdown("<h2 style='color:#1e293b'>🛠️ Optimization & Resource Analysis</h2>", unsafe_allow_html=True)
    sim = st.session_state.get("last_sim")
    if not sim:
        st.info("Run a simulation first (from What-If Simulator or AI Prediction) to see resource analysis here.")
    else:
        k = sim["kpis"]
        r = sim["resource_estimates"]
        st.markdown("### KPI Summary")
        cols = st.columns(6)
        cols[0].metric("Occupancy", f"{k['predicted_occupancy']:.0f}")
        cols[1].metric("Energy", f"{k['energy_demand']:.0f}")
        cols[2].metric("Utilization", f"{k['room_utilization']:.0f}%")
        cols[3].metric("Congestion", f"{k['predicted_congestion']:.0f}")
        cols[4].metric("Stress", k["resource_stress"])
        cols[5].metric("Extra Seats", k["resource_requirement"]["extra_seats"])

        st.markdown("### Resource Requirement Estimates")
        r1, r2, r3 = st.columns(3)
        r1.metric("Required Seats", r["required_seats"])
        r1.metric("Required Classrooms", r["required_classrooms"])
        r2.metric("Required Electricity (kWh)", r["required_electricity_kwh"])
        r2.metric("Parking Requirement", f"{r['parking_requirement']} slots")
        r3.metric("Canteen Load", f"{r['canteen_load']} occupants")
        r3.metric("Facility Load", f"{r['facility_load_pct']}%")

        # Facility load gauge
        fig = go.Figure(go.Indicator(
            mode="gauge+number", value=r["facility_load_pct"],
            title={"text": "Facility Load %"},
            gauge={"axis": {"range": [0, 120]},
                   "bar": {"color": "#2563eb"},
                   "steps": [
                       {"range": [0, 60], "color": "#dcfce7"},
                       {"range": [60, 85], "color": "#fef9c3"},
                       {"range": [85, 120], "color": "#fee2e2"}]}))
        fig.update_layout(height=280)
        st.plotly_chart(fig, use_container_width=True)

        st.markdown("### Decision-Support Recommendations")
        rec = generate_recommendation(sim)
        verdict_box(rec["verdict"])
        for ritem in rec["recommendations"]:
            icon = {"Critical": "🔴", "Warning": "🟠", "OK": "🟢"}.get(ritem["level"], "⚪")
            st.markdown(f"{icon} **[{ritem['area']}]** {ritem['message']}")
            st.caption(f"Factor: {ritem['factor']}")

# ============================================================================
# PAGE: HISTORY
# ============================================================================
elif page == "History":
    st.markdown("<h2 style='color:#1e293b'>📜 Simulation History</h2>", unsafe_allow_html=True)
    history = db.get_history(100)
    if not history:
        st.info("No saved simulations yet. Run a scenario from the What-If Simulator or Scenario Comparison pages.")
    else:
        c1, c2 = st.columns([4, 1])
        if c2.button("🗑️ Clear All History"):
            db.clear_history()
            st.rerun()

        rows = []
        for h in history:
            k = h["simulation"]["kpis"]
            rows.append({
                "ID": h["id"],
                "Name": h["scenario_name"],
                "Date": h["created_at"],
                "Location": h["simulation"]["block"],
                "Students": h["inputs"]["num_students"],
                "Attendance": h["inputs"]["event_attendance"],
                "Occupancy": round(k["predicted_occupancy"]),
                "Energy": round(k["energy_demand"]),
                "Utilization %": round(k["room_utilization"]),
                "Congestion": round(k["predicted_congestion"]),
                "Stress": k["resource_stress"],
                "Verdict": h["recommendation"]["verdict"],
            })
        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

        st.markdown("### Detail View")
        sel = st.selectbox("Select a record", [f"#{h['id']} {h['scenario_name']}" for h in history])
        sel_id = int(sel.split(" ")[0].replace("#", ""))
        sel_h = next(h for h in history if h["id"] == sel_id)
        with st.expander("Inputs", expanded=True):
            st.json(sel_h["inputs"])
        with st.expander("Predictions & KPIs"):
            st.json(sel_h["simulation"]["kpis"])
        with st.expander("Resource Estimates"):
            st.json(sel_h["simulation"]["resource_estimates"])
        with st.expander("Recommendations"):
            for r in sel_h["recommendation"]["recommendations"]:
                icon = {"Critical": "🔴", "Warning": "🟠", "OK": "🟢"}.get(r["level"], "⚪")
                st.markdown(f"{icon} **[{r['area']}]** {r['message']}")
                st.caption(f"Factor: {r['factor']}")

        if st.button("Delete this record"):
            db.delete_scenario(sel_id)
            st.rerun()
