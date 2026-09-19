"""Decision-support recommendation engine based on simulation values."""


def generate_recommendation(sim):
    """Produce structured, factor-based recommendations from a simulation result.

    Each recommendation includes the triggering factor + value so it is
    never arbitrary.
    """
    k = sim["kpis"]
    r = sim["resource_estimates"]
    block = sim["block"]
    recs = []

    # Occupancy / venue
    util = k["room_utilization"]
    occ = k["predicted_occupancy"]
    if util >= 85:
        recs.append({
            "level": "Critical",
            "area": "Venue",
            "message": (f"High occupancy detected ({occ:.0f} at {util:.0f}% utilization "
                        f"in {block}). Consider a larger venue or split the event."),
            "factor": f"Utilization {util:.0f}% >= 85%",
        })
    elif util >= 60:
        recs.append({
            "level": "Warning",
            "area": "Venue",
            "message": (f"Moderate occupancy load ({util:.0f}% utilization in {block}). "
                        f"Monitor attendance and prepare overflow seating."),
            "factor": f"Utilization {util:.0f}% in 60-85% band",
        })
    else:
        recs.append({
            "level": "OK",
            "area": "Venue",
            "message": f"Current location {block} has sufficient capacity ({util:.0f}% utilization).",
            "factor": f"Utilization {util:.0f}% < 60%",
        })

    # Energy
    energy = k["energy_demand"]
    if energy >= 300:
        recs.append({
            "level": "Critical",
            "area": "Energy",
            "message": (f"Energy demand is very high ({energy:.0f} kWh). "
                        f"Schedule non-critical loads off-peak or activate backup power."),
            "factor": f"Energy {energy:.0f} kWh >= 300",
        })
    elif energy >= 150:
        recs.append({
            "level": "Warning",
            "area": "Energy",
            "message": f"Energy demand elevated ({energy:.0f} kWh). Verify HVAC capacity for this time period.",
            "factor": f"Energy {energy:.0f} kWh in 150-300 band",
        })

    # Congestion / parking
    cong = k["predicted_congestion"]
    if cong >= 70:
        recs.append({
            "level": "Critical",
            "area": "Traffic",
            "message": (f"Parking congestion may increase sharply (congestion index {cong:.0f}/100). "
                        f"Open overflow parking and stagger arrival times."),
            "factor": f"Congestion {cong:.0f} >= 70",
        })
    elif cong >= 40:
        recs.append({
            "level": "Warning",
            "area": "Traffic",
            "message": f"Traffic congestion building (index {cong:.0f}/100). Inform attendees of parking options.",
            "factor": f"Congestion {cong:.0f} in 40-70 band",
        })

    # Resource stress
    stress = k["resource_stress"]
    if stress == "High":
        recs.append({
            "level": "Critical",
            "area": "Resources",
            "message": (f"Resource stress predicted HIGH in {block}. "
                        f"Additional staff, seating, and supplies may be required."),
            "factor": "ML stress classifier = High",
        })
    elif stress == "Medium":
        recs.append({
            "level": "Warning",
            "area": "Resources",
            "message": f"Resource stress predicted MEDIUM. Pre-position extra resources for {block}.",
            "factor": "ML stress classifier = Medium",
        })

    # Resource deficits
    extra = k["resource_requirement"]
    if extra["extra_seats"] > 0:
        recs.append({
            "level": "Critical",
            "area": "Capacity",
            "message": (f"Capacity exceeded by {extra['extra_seats']} seats "
                        f"({extra['extra_classrooms']} extra classrooms needed)."),
            "factor": f"Occupancy {occ:.0f} > capacity",
        })

    if r["parking_requirement"] > 600:
        recs.append({
            "level": "Warning",
            "area": "Parking",
            "message": (f"Estimated parking demand {r['parking_requirement']} slots "
                        f"exceeds main lot capacity (600)."),
            "factor": f"Parking {r['parking_requirement']} > 600",
        })

    if r["canteen_load"] > 200:
        recs.append({
            "level": "Warning",
            "area": "Canteen",
            "message": (f"Canteen load estimated at {r['canteen_load']} occupants. "
                        f"Consider extra food stalls / extended timings."),
            "factor": f"Canteen load {r['canteen_load']} > 200",
        })

    if not recs:
        recs.append({
            "level": "OK",
            "area": "Overall",
            "message": "All indicators within safe range. No special action required.",
            "factor": "All metrics below warning thresholds",
        })

    # Overall decision verdict
    critical = [x for x in recs if x["level"] == "Critical"]
    warnings = [x for x in recs if x["level"] == "Warning"]
    if critical:
        verdict = "Risky - revise plan before proceeding"
    elif warnings:
        verdict = "Feasible with precautions"
    else:
        verdict = "Safe to proceed"

    return {
        "recommendations": recs,
        "verdict": verdict,
        "critical_count": len(critical),
        "warning_count": len(warnings),
    }
