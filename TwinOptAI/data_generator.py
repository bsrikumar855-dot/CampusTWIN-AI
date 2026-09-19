"""Generate synthetic campus data and CSV for TwinOpt AI training."""
import os
import random
import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CSV_PATH = os.path.join(DATA_DIR, "campus_data.csv")

CAMPUS_BLOCKS = ["Block A", "Block B", "Block C", "Auditorium", "Library", "Parking Area", "Canteen"]
EVENT_TYPES = ["None", "Lecture", "Workshop", "Seminar", "Large Event", "Exam", "Cultural"]
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# Base capacity per location (seats / occupants)
BASE_CAPACITY = {
    "Block A": 400,
    "Block B": 500,
    "Block C": 350,
    "Auditorium": 1000,
    "Library": 300,
    "Parking Area": 600,
    "Canteen": 250,
}


def _occupancy_formula(num_students, event_attendance, time, temp, block, event_type):
    """Deterministic-ish occupancy model with realistic non-linear behaviour."""
    hour = int(str(time).split(":")[0])
    # Peak hours around 10-12 and 14-16
    time_factor = 0.6 + 0.4 * max(0, np.cos((hour - 13) * np.pi / 12))
    block_factor = {"Block A": 0.8, "Block B": 0.9, "Block C": 0.7,
                    "Auditorium": 1.0, "Library": 0.5, "Parking Area": 0.6,
                    "Canteen": 0.4}.get(block, 0.7)
    event_factor = {"None": 0.3, "Lecture": 0.7, "Workshop": 0.8, "Seminar": 0.85,
                    "Large Event": 1.0, "Exam": 0.95, "Cultural": 0.9}.get(event_type, 0.5)
    # Temperature: comfortable ~22C, extreme reduces occupancy slightly
    temp_factor = 1.0 - 0.01 * abs(temp - 22)
    base = num_students * 0.15 + event_attendance * 0.8
    occ = base * time_factor * block_factor * event_factor * max(0.3, temp_factor)
    noise = random.gauss(0, 0.05) * occ
    return max(0, int(occ + noise))


def _energy_formula(occupancy, num_students, time, temp, block):
    """Energy demand (kWh) grows with occupancy, students and HVAC need."""
    hour = int(str(time).split(":")[0])
    hvac = 1.0 + 0.03 * abs(temp - 22)  # more energy when far from comfort
    block_energy = {"Block A": 1.0, "Block B": 1.1, "Block C": 0.9,
                    "Auditorium": 1.4, "Library": 0.8, "Parking Area": 0.5,
                    "Canteen": 1.2}.get(block, 1.0)
    e = (occupancy * 0.4 + num_students * 0.05) * hvac * block_energy
    if 8 <= hour <= 18:
        e *= 1.1
    noise = random.gauss(0, 0.04) * e
    return max(0, round(e + noise, 2))


def _traffic_formula(occupancy, event_attendance, time, block):
    hour = int(str(time).split(":")[0])
    rush = 1.3 if hour in (8, 9, 16, 17, 18) else 1.0
    t = (occupancy * 0.3 + event_attendance * 0.5) * rush
    if block == "Parking Area":
        t *= 1.4
    return round(min(100, t), 2)


def _resource_availability_formula(occupancy, capacity, block):
    util = occupancy / max(1, capacity)
    return round(max(0, 1.0 - util), 3)


def generate_records(n=800, seed=42):
    random.seed(seed)
    np.random.seed(seed)
    rows = []
    for _ in range(n):
        block = random.choice(CAMPUS_BLOCKS)
        event_type = random.choices(EVENT_TYPES, weights=[5, 3, 2, 2, 1, 1, 1])[0]
        num_students = random.randint(100, 1200)
        if event_type == "Large Event":
            event_attendance = random.randint(200, 600)
        elif event_type == "None":
            event_attendance = 0
        else:
            event_attendance = random.randint(20, 300)
        time = f"{random.randint(7, 20):02d}:00"
        day = random.choice(DAYS)
        temp = round(random.uniform(12, 40), 1)
        capacity = BASE_CAPACITY[block]
        occupancy = _occupancy_formula(num_students, event_attendance, time, temp, block, event_type)
        occupancy = min(occupancy, int(capacity * 1.2))
        energy = _energy_formula(occupancy, num_students, time, temp, block)
        traffic = _traffic_formula(occupancy, event_attendance, time, block)
        resource_avail = _resource_availability_formula(occupancy, capacity, block)
        rows.append({
            "num_students": num_students,
            "event_attendance": event_attendance,
            "time": time,
            "day": day,
            "temperature": temp,
            "campus_block": block,
            "event_type": event_type,
            "room_capacity": capacity,
            "historical_occupancy": occupancy,
            "energy_consumption": energy,
            "traffic_level": traffic,
            "resource_availability": resource_avail,
        })
    return pd.DataFrame(rows)


def ensure_data():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(CSV_PATH):
        df = generate_records(800)
        df.to_csv(CSV_PATH, index=False)
        print(f"Generated {len(df)} records -> {CSV_PATH}")
    else:
        print(f"Data already exists at {CSV_PATH}")
    return CSV_PATH


if __name__ == "__main__":
    ensure_data()
