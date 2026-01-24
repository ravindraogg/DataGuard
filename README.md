# DataHeal AI is an autonomous data-healing system designed for data pipelines.
#### It detects corrupted, missing, delayed, or anomalous data in real time, reconstructs it safely, and improves itself over time using experience-based learning.

## Phase 1 – Core Data Healing Model (Foundation)

### Objective

Build a model that understands **normal sensor behavior** and can reconstruct missing or corrupted values using temporal patterns.

### What Was Implemented

* Sequence-based **LSTM neural network**
* Sliding-window time-series prediction
* Multi-sensor + actuator context input
* Next-step sensor value reconstruction

### Data Handling

* Normalization using sensor-wise mean and standard deviation
* Artificial corruption during training:

  * Noise injection
  * Masked (missing) values
  * Frozen values

### Model Characteristics

* Supervised learning
* Context-aware predictions
* Device-agnostic design
* Supports structured IoT formats (CSV, JSON, streams)

### Output Artifact

* `dataheal_core_model.pt`

### Result

A stable baseline model capable of healing missing or corrupted sensor data, but without learning from live behavior.


## Phase 2 – Live Inference, Confidence Gating, and Monitoring

### Objective

Safely deploy the model into a **real-time data pipeline** and make its behavior observable.

### Architecture

```
Sensor / Simulator (Node.js)
        ↓
Python Healing API (Flask)
        ↓
Healed Data + Metadata
        ↓
Database / Downstream Systems
```

### Key Features Added

* Real-time inference via REST API
* Warmup phase for buffer initialization
* Model phase for actual healing
* Sliding window inference logic

### Confidence & Safety Layer

* Per-sensor confidence score
* Confidence derived from deviation against sensor ranges
* Healing never happens silently

### Anomaly Classification

* `no_anomaly`
* `single_missing`
* `multi_missing`
* `low_confidence`
* `cold_start` (warmup)

### Monitoring

* Live counters for:

  * Total healed samples
  * Anomaly types
  * Low-confidence events
* `/stats` endpoint for real-time visibility

### Result

A **production-safe live system** that heals data continuously, exposes its decisions, and allows monitoring and rollback.



## Phase 3 – Learning From Experience (Reinforcement Layer)

### Objective

Enable DataHeal AI to **improve itself over time** using real-world feedback, without risky live retraining.

### Experience Collection

* Each healed event logs:

  * Timestamp
  * Mode (warmup / model)
  * Anomaly type
  * Confidence scores
  * Reward signal
* Stored in:

  * `dataheal_experience.json`

### Reward Mechanism

* Short-term stability evaluation
* Positive reward for stable corrections
* Negative reward for unstable corrections
* Average reward used as learning weight

### Offline Reinforcement Training

* Only **model-mode** experiences are used
* Reward-weighted loss function
* Confidence-aware evaluation
* Metrics tracked:

  * Training loss
  * Validation loss
  * R² score
  * Confidence trend

### Training Outcome

* Initial negative R² due to small dataset (expected)
* With sufficient experience and epochs:

  * **R² ≈ 0.95**
  * **Confidence ≈ 1.0**

### Output Artifact

* `dataheal_core_model_v2.pt`

### Deployment

* v2 deployed safely
* No live retraining
* Rollback-ready design
* Live behavior monitored continuously

---

## Current System Capabilities

* Real-time autonomous data healing
* Confidence-gated corrections
* Anomaly-aware processing
* Experience-based self-improvement
* Versioned model deployment
* Live monitoring and observability
* Safe rollback path