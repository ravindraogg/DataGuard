from flask import Flask, request, jsonify
import torch
import torch.nn as nn
import numpy as np
from collections import deque
import os, json, time

# ---------------- CONFIG ----------------
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODELS_DIR = "models"
INDEX_FILE = "core_model_index.pt"
BASE_CONF_THRESHOLD = 0.6
ERROR_TOLERANCE = 0.25 # Increased tolerance for smoother rewards
LOG_DIR = "experience_logs"

os.makedirs(LOG_DIR, exist_ok=True)
app = Flask(__name__)

# ---------------- MODEL ----------------
class HealingModel(nn.Module):
    def __init__(self, input_size, output_size):
        super().__init__()
        self.lstm = nn.LSTM(input_size, 64, batch_first=True)
        self.fc = nn.Linear(64, output_size)

    def forward(self, x):
        x, _ = self.lstm(x)
        return self.fc(x[:, -1])

# ---------------- LOAD EXPERTS ----------------
EXPERTS = {}

def load_experts():
    # Check if index exists before loading
    index_path = os.path.join(MODELS_DIR, INDEX_FILE)
    if not os.path.exists(index_path):
        print("⚠️ Model index not found. Run training first.")
        return
        
    index = torch.load(index_path, map_location=DEVICE)

    for domain, file in index["domains"].items():
        if domain == "other": continue
        
        ckpt_path = os.path.join(MODELS_DIR, file)
        ckpt = torch.load(ckpt_path, map_location=DEVICE)
        model = HealingModel(len(ckpt["sensors"]), len(ckpt["sensors"])).to(DEVICE)
        model.load_state_dict(ckpt["model_state"])
        model.eval()

        EXPERTS[domain] = {
            "model": model,
            "sensors": ckpt["sensors"],
            "mean": ckpt["sensor_mean"],
            "std": ckpt["sensor_std"],
            "window": ckpt["window"],
            "buffer": deque(maxlen=ckpt["window"]),
            "last_known": {}
        }

load_experts()

# ---------------- DOMAIN LOCK ----------------
DOMAIN_LOCK = {}
KNOWN_SIGNATURES = {
    ",".join(sorted(['temperature','humidity','water_level'])): "agriculture",
    ",".join(sorted(['voltage','current','frequency','power'])): "energy",
    ",".join(sorted(['heart_rate','spo2','body_temperature'])): "healthcare",
    ",".join(sorted(['temperature','vibration','current','acoustic'])): "industrial"

}

def route_domain(keys):
    sig = ",".join(sorted(keys))
    if sig in KNOWN_SIGNATURES:
        return KNOWN_SIGNATURES[sig], 1.0
    return "other", 0.0

# ---------------- PHASE 5: EXPERIENCE ----------------
PENDING = {}

def log_experience(domain, record):
    path = os.path.join(LOG_DIR, f"{domain}.jsonl")
    with open(path, "a") as f:
        f.write(json.dumps(record) + "\n")

def evaluate(healed, real):
    err = abs(healed - real) / max(abs(real), 1e-6)
    reward = 1 if err <= ERROR_TOLERANCE else -1
    return reward, err

# ---------------- PHASE 6: POLICY ENGINE ----------------
def load_recent_logs(domain, limit=100):
    path = os.path.join(LOG_DIR, f"{domain}.jsonl")
    if not os.path.exists(path): return []
    with open(path) as f:
        return [json.loads(l) for l in f.readlines()[-limit:]]

def trust_from_rewards(rewards):
    if not rewards: return 0.7  # Start with higher initial trust
    # Smooth trust calculation to prevent single-error lockouts
    return max(0.0, min(1.0, (sum(rewards)/len(rewards) + 1)/2))

def phase6_policy(domain, confidence, missing):
    logs = load_recent_logs(domain)
    domain_rewards = [l["reward"] for l in logs]
    domain_trust = trust_from_rewards(domain_rewards)

    threshold = BASE_CONF_THRESHOLD

    # Strategy selection with lowered thresholds
    if confidence < threshold:
        strategy = "PASSTHROUGH"
    elif domain_trust < 0.15: # Lowered from 0.2 to be more permissive
        strategy = "LAST_KNOWN"
    else:
        strategy = "MODEL_INFER"

    return {
        "strategy": strategy,
        "threshold": round(threshold,2),
        "domain_trust": round(domain_trust,2),
    }

# ---------------- HEALING ----------------
def heal_stream(domain, data, confidence):
    if domain == "other":
        return data, "passthrough_other", {"reason":"unknown domain"}

    expert = EXPERTS[domain]
    missing = [s for s in expert["sensors"] if data.get(s) is None]

    # 1. PRE-POLICY BUFFER UPDATE: Ensure LSTM always has data
    vec = []
    for s in expert["sensors"]:
        val = data.get(s)
        if val is None:
            val = expert["last_known"].get(s, expert["mean"][s])
        vec.append(val)
    expert["buffer"].append(vec)

    # 2. POLICY EVALUATION
    policy = phase6_policy(domain, confidence, missing)
    healed = data.copy()

    # 3. WARMUP CHECK: Priority over strategy
    if len(expert["buffer"]) < expert["window"]:
        for s in missing:
            healed[s] = expert["last_known"].get(s, expert["mean"][s])
        return healed, "warmup", policy

    # 4. APPLY CHOSEN STRATEGY
    if policy["strategy"] == "PASSTHROUGH":
        return data, "policy_passthrough", policy

    if policy["strategy"] == "LAST_KNOWN":
        for s in missing:
            healed[s] = expert["last_known"].get(s, expert["mean"][s])
        return healed, "policy_last_known", policy

    # 5. MODEL_INFER
    x = torch.tensor([expert["buffer"]], dtype=torch.float32).to(DEVICE)
    mean_vals = torch.tensor(list(expert["mean"].values()), device=DEVICE)
    std_vals = torch.tensor(list(expert["std"].values()), device=DEVICE)
    x = (x - mean_vals) / (std_vals + 1e-6)

    with torch.no_grad():
        pred = expert["model"](x)[0].cpu().numpy()

    ts = time.time()
    for i, s in enumerate(expert["sensors"]):
        if data.get(s) is None:
            # Map prediction back to original scale
            healed[s] = round(float(pred[i]), 2)
            PENDING[(domain, s)] = {
                "healed": healed[s],
                "confidence": confidence,
                "timestamp": ts
            }
        expert["last_known"][s] = healed[s]

    return healed, "expert_inference", policy

# ---------------- API ----------------
@app.route("/heal", methods=["POST"])
def heal():
    data = request.json
    sig = ",".join(sorted(data.keys()))

    if sig not in DOMAIN_LOCK:
        DOMAIN_LOCK[sig] = route_domain(list(data.keys()))

    domain, confidence = DOMAIN_LOCK[sig]
    healed, mode, policy = heal_stream(domain, data, confidence)

    # Feedback Loop for Phase 5
    for k, v in data.items():
        key = (domain, k)
        if key in PENDING and v is not None:
            exp = PENDING.pop(key)
            reward, err = evaluate(exp["healed"], v)
            log_experience(domain, {
                "sensor": k, "healed": exp["healed"], "real": v,
                "reward": reward, "error": err, "timestamp": time.time()
            })

    return jsonify({
  "domain": domain,
  "confidence": confidence,
  "mode": mode,
  "policy": policy,
  "data": healed
})


if __name__ == "__main__":
    print("🚀 DataHeal Server Online (Phase 6 - Trust Fixed)")
    app.run(port=5001)