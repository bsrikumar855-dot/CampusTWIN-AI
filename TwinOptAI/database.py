"""SQLite storage for TwinOpt AI scenarios and simulation history."""
import os
import json
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "twinopt.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS scenarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scenario_name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            inputs TEXT NOT NULL,
            predictions TEXT NOT NULL,
            simulation TEXT NOT NULL,
            recommendation TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


def save_scenario(name, inputs, predictions, simulation, recommendation):
    conn = get_conn()
    conn.execute(
        """INSERT INTO scenarios
           (scenario_name, created_at, inputs, predictions, simulation, recommendation)
           VALUES (?,?,?,?,?,?)""",
        (
            name,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            json.dumps(inputs, default=str),
            json.dumps(predictions, default=str),
            json.dumps(simulation, default=str),
            json.dumps(recommendation, default=str),
        ),
    )
    conn.commit()
    conn.close()


def get_history(limit=100):
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM scenarios ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    out = []
    for r in rows:
        out.append({
            "id": r["id"],
            "scenario_name": r["scenario_name"],
            "created_at": r["created_at"],
            "inputs": json.loads(r["inputs"]),
            "predictions": json.loads(r["predictions"]),
            "simulation": json.loads(r["simulation"]),
            "recommendation": json.loads(r["recommendation"]),
        })
    return out


def clear_history():
    conn = get_conn()
    conn.execute("DELETE FROM scenarios")
    conn.commit()
    conn.close()


def delete_scenario(scenario_id):
    conn = get_conn()
    conn.execute("DELETE FROM scenarios WHERE id=?", (scenario_id,))
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized at", DB_PATH)
