"""Digital Twin: virtual campus representation + Plotly visualization."""
import numpy as np
import plotly.graph_objects as go

CAMPUS_LOCATIONS = {
    "Block A":      {"capacity": 400,  "x": 1, "y": 3, "type": "Classrooms"},
    "Block B":      {"capacity": 500,  "x": 3, "y": 3, "type": "Classrooms"},
    "Block C":      {"capacity": 350,  "x": 5, "y": 3, "type": "Classrooms"},
    "Auditorium":   {"capacity": 1000, "x": 3, "y": 5, "type": "Auditorium"},
    "Library":      {"capacity": 300,  "x": 1, "y": 1, "type": "Library"},
    "Parking Area": {"capacity": 600,  "x": 5, "y": 1, "type": "Parking"},
    "Canteen":      {"capacity": 250,  "x": 3, "y": 1, "type": "Canteen"},
}


def utilization(occupancy, capacity):
    return round((occupancy / max(1, capacity)) * 100, 1)


def energy_for(occupancy, base_capacity):
    """Estimate energy demand from occupancy when ML not available."""
    return round(occupancy * 0.4 + base_capacity * 0.02, 2)


def stress_from_util(util_pct):
    if util_pct >= 85:
        return "High"
    if util_pct >= 50:
        return "Medium"
    return "Low"


def build_twin_state(predictions_by_location):
    """Build per-location state from a dict {location: prediction_dict}.

    prediction_dict keys: predicted_occupancy, energy_demand, resource_stress
    """
    state = {}
    for name, info in CAMPUS_LOCATIONS.items():
        pred = predictions_by_location.get(name, {})
        occ = pred.get("predicted_occupancy", 0)
        energy = pred.get("energy_demand", energy_for(occ, info["capacity"]))
        stress = pred.get("resource_stress", stress_from_util(utilization(occ, info["capacity"])))
        util = utilization(occ, info["capacity"])
        state[name] = {
            "type": info["type"],
            "capacity": info["capacity"],
            "current_occupancy": int(round(occ)),
            "predicted_occupancy": round(occ, 1),
            "utilization": util,
            "energy_demand": round(energy, 2),
            "resource_stress": stress,
            "x": info["x"],
            "y": info["y"],
        }
    return state


def default_twin_state():
    """Idle/baseline campus state (no events)."""
    preds = {name: {"predicted_occupancy": info["capacity"] * 0.2,
                    "energy_demand": info["capacity"] * 0.08,
                    "resource_stress": "Low"}
             for name, info in CAMPUS_LOCATIONS.items()}
    return build_twin_state(preds)


def _stress_color(stress):
    return {"High": "#e74c3c", "Medium": "#f39c12", "Low": "#27ae60"}.get(stress, "#3498db")


def campus_visualization(state):
    """Interactive 2D campus map with Plotly."""
    fig = go.Figure()
    # Background "ground" rectangle
    fig.add_shape(type="rect", x0=0, y0=0, x1=6, y1=6,
                  line=dict(color="#dfe6e9", width=2),
                  fillcolor="#f5f6fa", layer="below")

    for name, s in state.items():
        color = _stress_color(s["resource_stress"])
        util = s["utilization"]
        size = 40 + min(60, util / 2)
        fig.add_trace(go.Scatter(
            x=[s["x"]], y=[s["y"]],
            mode="markers+text",
            marker=dict(size=size, color=color, opacity=0.85,
                        line=dict(width=2, color="#2d3436")),
            text=[name],
            textposition="top center",
            hovertext=(f"<b>{name}</b><br>Type: {s['type']}<br>"
                       f"Capacity: {s['capacity']}<br>"
                       f"Occupancy: {s['current_occupancy']}<br>"
                       f"Utilization: {util}%<br>"
                       f"Energy: {s['energy_demand']} kWh<br>"
                       f"Stress: {s['resource_stress']}"),
            hoverinfo="text",
            showlegend=False,
        ))

    fig.update_layout(
        xaxis=dict(range=[-0.5, 6.5], showgrid=False, zeroline=False,
                   showticklabels=False),
        yaxis=dict(range=[-0.5, 6.5], showgrid=False, zeroline=False,
                   showticklabels=False, scaleanchor="x", scaleratio=1),
        margin=dict(l=10, r=10, t=10, b=10),
        height=420,
        plot_bgcolor="white",
        title=dict(text="Digital Campus Map (color = resource stress)",
                   font=dict(size=13)),
    )
    return fig


def utilization_bar_chart(state):
    names = list(state.keys())
    utils = [state[n]["utilization"] for n in names]
    fig = go.Figure(go.Bar(
        x=names, y=utils,
        marker_color=[_stress_color(state[n]["resource_stress"]) for n in names],
        text=[f"{u}%" for u in utils], textposition="outside",
    ))
    fig.update_layout(
        yaxis=dict(title="Utilization %", range=[0, 120]),
        xaxis=dict(title="Location"),
        margin=dict(l=20, r=20, t=20, b=40),
        height=320,
    )
    return fig


def energy_bar_chart(state):
    names = list(state.keys())
    energy = [state[n]["energy_demand"] for n in names]
    fig = go.Figure(go.Bar(
        x=names, y=energy, marker_color="#3498db",
        text=[f"{e}" for e in energy], textposition="outside",
    ))
    fig.update_layout(
        yaxis=dict(title="Energy (kWh)"),
        xaxis=dict(title="Location"),
        margin=dict(l=20, r=20, t=20, b=40),
        height=320,
    )
    return fig
