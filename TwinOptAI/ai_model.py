"""Machine-learning models for TwinOpt AI: occupancy, energy, resource stress."""
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, accuracy_score

from data_generator import ensure_data, CSV_PATH

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
OCCUPANCY_MODEL_PATH = os.path.join(MODELS_DIR, "occupancy_model.pkl")
ENERGY_MODEL_PATH = os.path.join(MODELS_DIR, "energy_model.pkl")
STRESS_MODEL_PATH = os.path.join(MODELS_DIR, "stress_model.pkl")

CAMPUS_BLOCKS = ["Block A", "Block B", "Block C", "Auditorium", "Library", "Parking Area", "Canteen"]
EVENT_TYPES = ["None", "Lecture", "Workshop", "Seminar", "Large Event", "Exam", "Cultural"]


def _hour(time_str):
    return int(str(time_str).split(":")[0])


def _stress_label(avail):
    """Convert resource availability 0..1 into Low/Medium/High stress."""
    if avail >= 0.6:
        return "Low"
    elif avail >= 0.3:
        return "Medium"
    return "High"


def build_feature_matrix(df, le_block, le_event):
    df = df.copy()
    df["hour"] = df["time"].apply(_hour)
    X = pd.DataFrame({
        "num_students": df["num_students"],
        "event_attendance": df["event_attendance"],
        "hour": df["hour"],
        "temperature": df["temperature"],
        "room_capacity": df["room_capacity"],
        "campus_block_enc": le_block.transform(df["campus_block"]),
        "event_type_enc": le_event.transform(df["event_type"]),
    })
    return X


def train_models():
    """Train occupancy (regression), energy (regression), stress (classifier)."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    ensure_data()
    df = pd.read_csv(CSV_PATH, keep_default_na=False)

    le_block = LabelEncoder().fit(CAMPUS_BLOCKS)
    le_event = LabelEncoder().fit(EVENT_TYPES)

    X = build_feature_matrix(df, le_block, le_event)

    # --- Occupancy regression ---
    y_occ = df["historical_occupancy"]
    Xtr, Xte, ytr, yte = train_test_split(X, y_occ, test_size=0.2, random_state=42)
    occ_model = RandomForestRegressor(n_estimators=120, random_state=42, n_jobs=-1)
    occ_model.fit(Xtr, ytr)
    occ_mae = mean_absolute_error(yte, occ_model.predict(Xte))

    # --- Energy regression ---
    y_energy = df["energy_consumption"]
    Xtr, Xte, ytr, yte = train_test_split(X, y_energy, test_size=0.2, random_state=42)
    energy_model = RandomForestRegressor(n_estimators=120, random_state=42, n_jobs=-1)
    energy_model.fit(Xtr, ytr)
    energy_mae = mean_absolute_error(yte, energy_model.predict(Xte))

    # --- Resource stress classifier ---
    y_stress = df["resource_availability"].apply(_stress_label)
    Xtr, Xte, ytr, yte = train_test_split(X, y_stress, test_size=0.2, random_state=42)
    stress_model = RandomForestClassifier(n_estimators=120, random_state=42, n_jobs=-1)
    stress_model.fit(Xtr, ytr)
    stress_acc = accuracy_score(yte, stress_model.predict(Xte))

    bundle = {
        "occupancy": occ_model,
        "energy": energy_model,
        "stress": stress_model,
        "le_block": le_block,
        "le_event": le_event,
        "metrics": {
            "occupancy_mae": round(occ_mae, 2),
            "energy_mae": round(energy_mae, 2),
            "stress_accuracy": round(stress_acc, 3),
        },
    }
    with open(OCCUPANCY_MODEL_PATH, "wb") as f:
        pickle.dump(bundle, f)
    # Keep separate copies named as requested for clarity
    with open(ENERGY_MODEL_PATH, "wb") as f:
        pickle.dump(bundle, f)
    with open(STRESS_MODEL_PATH, "wb") as f:
        pickle.dump(bundle, f)
    print("Models trained. Metrics:", bundle["metrics"])
    return bundle


def load_models():
    if not os.path.exists(OCCUPANCY_MODEL_PATH):
        return train_models()
    with open(OCCUPANCY_MODEL_PATH, "rb") as f:
        return pickle.load(f)


def predict(bundle, inputs):
    """Run prediction for a single scenario input dict.

    inputs keys: num_students, event_attendance, time, temperature,
                 campus_block, event_type, room_capacity
    Returns dict of predictions.
    """
    le_block = bundle["le_block"]
    le_event = bundle["le_event"]

    block = inputs.get("campus_block", "Block A")
    if block not in CAMPUS_BLOCKS:
        block = "Block A"
    event_type = inputs.get("event_type", "None")
    if event_type not in EVENT_TYPES:
        event_type = "None"

    feat = pd.DataFrame([{
        "num_students": inputs["num_students"],
        "event_attendance": inputs["event_attendance"],
        "hour": _hour(inputs["time"]),
        "temperature": inputs["temperature"],
        "room_capacity": inputs.get("room_capacity", 500),
        "campus_block_enc": le_block.transform([block])[0],
        "event_type_enc": le_event.transform([event_type])[0],
    }])

    occ = float(bundle["occupancy"].predict(feat)[0])
    energy = float(bundle["energy"].predict(feat)[0])
    stress = str(bundle["stress"].predict(feat)[0])

    return {
        "predicted_occupancy": round(max(0, occ), 1),
        "energy_demand": round(max(0, energy), 2),
        "resource_stress": stress,
    }


if __name__ == "__main__":
    train_models()
