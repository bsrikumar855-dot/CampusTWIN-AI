"""What-If Simulator: compute campus-wide outcomes for a scenario input."""
import math
from ai_model import predict, CAMPUS_BLOCKS
from digital_twin import (CAMPUS_LOCATIONS, utilization, energy_for,
                          stress_from_util, build_twin_state)


def _hour(time_str):
    try:
        return int(str(time_str).split(":")[0])
    except Exception:
        return 12


def _traffic(occupancy, event_attendance, hour, block):
    rush = 1.3 if hour in (8, 9, 16, 17, 18) else 1.0
    t = (occupancy * 0.3 + event_attendance * 0.5) * rush
    if block == "Parking Area":
        t *= 1.4
    return round(min(100, t), 2)


def _resource_requirement(occupancy, capacity):
    """Extra seats / rooms needed beyond current capacity."""
    deficit = max(0, occupancy - capacity)
    rooms_needed = math.ceil(deficit / 50)  # ~50 seats per classroom
    return {
        "extra_seats": int(deficit),
        "extra_classrooms": rooms_needed,
    }


def run_simulation(bundle, inputs):
    """Run a full what-if simulation.

    inputs: dict with num_students, event_attendance, time, temperature,
            campus_block, event_type
    Returns dict with predictions, per-location twin state, KPIs,
    resource estimates, traffic.
    """
    block = inputs.get("campus_block", "Block A")
    if block not in CAMPUS_BLOCKS:
        block = "Block A"
    capacity = CAMPUS_LOCATIONS[block]["capacity"]
    inputs_full = dict(inputs)
    inputs_full["room_capacity"] = capacity

    # Core ML predictions at the chosen location
    core = predict(bundle, inputs_full)

    # Distribute influence across the campus for the digital twin
    preds = {}
    for name, info in CAMPUS_LOCATIONS.items():
        if name == block:
            preds[name] = core
        else:
            # Spillover: other locations receive a fraction of the event load
            local_inputs = dict(inputs_full)
            local_inputs["campus_block"] = name
            local_inputs["room_capacity"] = info["capacity"]
            local_inputs["event_attendance"] = int(inputs_full["event_attendance"] * 0.15)
            local_inputs["num_students"] = int(inputs_full["num_students"] * 0.4)
            p = predict(bundle, local_inputs)
            preds[name] = p

    twin_state = build_twin_state(preds)

    # KPIs
    hour = _hour(inputs["time"])
    main = twin_state[block]
    occupancy = main["predicted_occupancy"]
    energy = main["energy_demand"]
    util = main["utilization"]
    stress = main["resource_stress"]
    traffic = _traffic(occupancy, inputs["event_attendance"], hour, block)
    resource_req = _resource_requirement(occupancy, capacity)

    # Campus-wide aggregates
    total_occupancy = sum(s["current_occupancy"] for s in twin_state.values())
    total_energy = round(sum(s["energy_demand"] for s in twin_state.values()), 2)
    avg_util = round(sum(s["utilization"] for s in twin_state.values()) / len(twin_state), 1)

    # Resource estimates
    required_seats = int(math.ceil(occupancy))
    required_classrooms = int(math.ceil(occupancy / 50))
    required_electricity = round(energy, 2)
    parking_req = int(math.ceil((inputs["num_students"] * 0.3 + inputs["event_attendance"] * 0.5)))
    canteen_load = int(math.ceil(occupancy * 0.3))
    facility_load_pct = round(min(100, (occupancy / capacity) * 100), 1)

    return {
        "block": block,
        "predictions": core,
        "twin_state": twin_state,
        "kpis": {
            "predicted_occupancy": occupancy,
            "energy_demand": energy,
            "room_utilization": util,
            "resource_stress": stress,
            "predicted_congestion": traffic,
            "resource_requirement": resource_req,
        },
        "resource_estimates": {
            "required_seats": required_seats,
            "required_classrooms": required_classrooms,
            "required_electricity_kwh": required_electricity,
            "parking_requirement": parking_req,
            "canteen_load": canteen_load,
            "facility_load_pct": facility_load_pct,
        },
        "campus_totals": {
            "total_occupancy": total_occupancy,
            "total_energy": total_energy,
            "avg_utilization": avg_util,
        },
    }
