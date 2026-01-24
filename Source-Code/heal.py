import os
import json
import torch
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from collections import deque
from datetime import datetime, timezone
import torch.nn as nn

# ===================== CONFIG =====================

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

MODEL_PATH = "dataheal_core_model.pt"
EXPERIENCE_PATH = "dataheal_experience.json"

WINDOW = 20
WARMUP_SIZE = 20

app = Flask(__name__)

# ===================== LOAD MODEL =====================

ckpt = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)

SENSOR_COLS = ckpt["signal_roles"]["heal_targets"]
CONTEXT_COLS = ckpt["signal_roles"]["context_signals"]

sensor_mean = pd.Series(ckpt["sensor_mean"])
sensor_std = pd.Series(ckpt["sensor_std"])

# ===================== MODEL =====================

class HealingModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=len(SENSOR_COLS) + len(CONTEXT_COLS),
            hidden_size=64,
            batch_first=True
        )
        self.fc = nn.Linear(64, len(SENSOR_COLS))

    def forward(self, x):
        x, _ = self.lstm(x)
        return self.fc(x[:, -1])


model = HealingModel().to(DEVICE)
model.load_state_dict(ckpt["model_state"])
model.eval()

# ===================== STATE =====================

buffer = deque(maxlen=WINDOW)
stats = {
    "total": 0,
    "warmup": 0,
    "model": 0
}

# ===================== EXPERIENCE STORE =====================

if not os.path.exists(EXPERIENCE_PATH):
    with open(EXPERIENCE_PATH, "w") as f:
        json.dump([], f)


def log_experience(record):
    with open(EXPERIENCE_PATH, "r") as f:
        data = json.load(f)

    data.append(record)

    with open(EXPERIENCE_PATH, "w") as f:
        json.dump(data, f, indent=2)

# ===================== ROUTES =====================

@app.route("/heal", methods=["POST"])
def heal():
    data = request.json
    stats["total"] += 1

    buffer.append(data)

    # Warmup phase
    if len(buffer) < WARMUP_SIZE:
        stats["warmup"] += 1
        return jsonify({
            **data,
            "mode": "warmup",
            "confidence": 0.5
        })

    stats["model"] += 1

    # Build input window
    df = pd.DataFrame(list(buffer))

    for col in SENSOR_COLS + CONTEXT_COLS:
        if col not in df:
            df[col] = 0.0

    x = df[SENSOR_COLS + CONTEXT_COLS].copy()
    x[SENSOR_COLS] = (x[SENSOR_COLS] - sensor_mean) / sensor_std
    x = x.fillna(0).values.astype(np.float32)

    x = torch.tensor(x).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        pred = model(x).cpu().numpy()[0]

    healed = data.copy()
    missing_fields = []

    for i, col in enumerate(SENSOR_COLS):
        if data.get(col) is None:
            healed[col] = round(
                float(pred[i] * sensor_std[col] + sensor_mean[col]),
                2
            )
            missing_fields.append(col)

    confidence = round(1.0 - (len(missing_fields) / max(len(SENSOR_COLS), 1)), 3)

    healed["mode"] = "model"
    healed["confidence"] = confidence

    # ---------------- EXPERIENCE LOG (PHASE 3) ----------------
    log_experience({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": "model",
        "missing_fields": missing_fields,
        "confidence": confidence
    })

    return jsonify(healed)


@app.route("/stats")
def stats_view():
    return jsonify(stats)


# ===================== RUN =====================

if __name__ == "__main__":
    app.run(debug=True)
