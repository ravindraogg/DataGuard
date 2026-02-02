![69807f7eedbdfb0e160e2b55](https://github.com/user-attachments/assets/158fa1ae-d2e9-421f-a2f6-3efed3806339)

# DataHeal AI (DataGuard)

## Autonomous Data-Healing System for Real-Time Data Pipelines

## Overview

DataHeal AI is an autonomous, production-safe data-healing system designed for real-time data pipelines, especially in IoT and sensor-driven environments.

The system detects missing, corrupted, delayed, or anomalous data, reconstructs it safely, and continuously improves using experience-based learning. Unlike traditional auto-correction systems, DataHeal AI prioritizes safety, explainability, and rollback-readiness.

The project is implemented in **six progressive phases**, each adding a critical capability required for real-world deployment.

## Problem Statement

Real-time data pipelines often suffer from:

* Missing sensor values
* Noise and corrupted readings
* Intermittent sensor failures
* Delayed or frozen data
* Domain-specific behavior differences

Most existing solutions either drop faulty data or apply aggressive corrections without measuring trust or long-term impact.

DataHeal AI addresses this gap by providing:

* Context-aware healing
* Confidence-gated corrections
* Learning from real outcomes
* Policy-controlled autonomy


## System Architecture (High-Level)

External Sensor / Simulator (Node.js)
→ DataHeal Engine (Python, Flask, PyTorch)
→ Policy & Trust Layer
→ Backend Service (Node.js, Express)
→ Database / Downstream Systems


## Phase 1 – Core Data Healing Model (Foundation)

### Objective

Learn normal temporal behavior of sensor data and reconstruct missing or corrupted values using historical context.

### Implementation

* Sequence-based LSTM neural network
* Sliding-window time-series prediction
* Multi-sensor and actuator context input
* Device-agnostic design

### Data Handling

* Sensor-wise normalization using mean and standard deviation
* Artificial corruption during training:

  * Noise injection
  * Missing value masking
  * Frozen sensor values

### Outcome

A trained baseline model capable of reconstructing missing or corrupted sensor values using learned temporal patterns.


## Phase 2 – Live Inference, Confidence Gating, and Monitoring

### Objective

Safely deploy the model into a real-time data pipeline with full observability.

### Implementation

* Real-time inference via REST API
* Warmup phase for buffer initialization
* Sliding-window inference during live streams

### Safety Layer

* Per-sensor confidence scoring
* Healing never applied silently
* Anomaly classification:

  * no_anomaly
  * single_missing
  * multi_missing
  * low_confidence
  * cold_start

### Monitoring

* Live counters for healed samples
* Anomaly distribution tracking
* Low-confidence event tracking
* Stats endpoint for real-time visibility

### Outcome

A production-safe, observable real-time healing system.


## Phase 3 – Learning From Experience (Reinforcement Layer)

### Objective

Enable self-improvement without risky live retraining.

### Experience Collection

Each healing event logs:

* Timestamp
* Operating mode
* Anomaly type
* Confidence score
* Healed value
* Reward signal

### Reward Mechanism

* Positive reward for stable corrections
* Negative reward for unstable corrections
* Error-based evaluation

### Offline Reinforcement Training

* Uses only trusted model-mode experiences
* Reward-weighted loss function
* Confidence-aware evaluation
* Metrics:

  * Training loss
  * Validation loss
  * R² score
  * Confidence trends

### Outcome

Improved model versions with measurable performance gains and safe rollback.


## Phase 4 – Domain-Aware Expert Routing

### Objective

Support heterogeneous data sources without cross-domain interference.

### Implementation

* Automatic sensor signature detection
* Routing to domain-specific expert models
* Supported domains:

  * Agriculture
  * Industrial
  * Energy
  * Healthcare

Each domain maintains:

* Independent models
* Normalization statistics
* Sliding buffers
* Experience logs

Unknown domains are safely passed through.

### Outcome

Scalable multi-domain healing without negative transfer.


## Phase 5 – Experience Validation and Trust Scoring

### Objective

Measure healing quality using real-world feedback.

### Implementation

* Healed values compared against later-arriving real sensor data
* Error-based reward generation
* Domain-level experience logs
* Trust score derived from historical rewards

This phase is experimentally validated and documented using structured analysis and visualization.

Reference implementation and experiments:
[https://www.kaggle.com/code/ravindraog/dataguard](https://www.kaggle.com/code/ravindraog/dataguard)

### Outcome

A continuously improving trust signal grounded in real system behavior.


## Phase 6 – Policy Engine and Controlled Autonomy

### Objective

Decide when and how healing should be applied in production.

### Policy Inputs

* Model confidence
* Domain trust score
* Presence of missing or anomalous sensors
* System warmup state

### Available Policies

PASSTHROUGH
The system forwards data without healing when confidence or trust is insufficient.

LAST_KNOWN_VALUE
Missing values are filled using the most recent valid readings when conservative stabilization is preferred.

MODEL_INFERENCE
Domain-specific expert models are used when confidence and trust are high.

### Explainability

Each response includes:

* Selected policy
* Confidence threshold
* Domain trust score

### Outcome

A controlled autonomous system that balances learning, safety, and reliability.


## Backend and Deployment

* Multi-domain sensor simulator (Node.js)
* Healing engine (Python, Flask, PyTorch)
* Backend API (Node.js, Express)
* Database integration (MongoDB)
* Device and authentication routes
* End-to-end data flow from ingestion to storage

The system is fully runnable in a local multi-service environment and designed for cloud deployment.

## Current Capabilities

* Real-time autonomous data healing
* Confidence-gated corrections
* Domain-specific expert models
* Experience-based trust scoring
* Policy-driven healing decisions
* Versioned model deployment
* Live monitoring and observability
* Safe rollback-ready architecture


## Future Work

* Public cloud deployment
* Dashboard-based visualization
* Adaptive domain discovery
* Online learning under strict safety constraints

## DataHeal AI – API Documentation

This document describes how internal services communicate inside the DataHeal AI system.
All APIs are **service-to-service contracts**, designed for decoupling, observability, and safety.


## 1. Sensor Simulator Service

This service generates realistic multi-domain sensor data with random faults and missing values.
It is used to validate DataHeal AI end-to-end behavior.

Base URL
[http://localhost:7000](http://localhost:7000)



### Get Latest Sensor Packet

Endpoint
GET /api/latest

What it does
Returns the most recent simulated sensor data packet for the active domain.

Behavior notes

* Some sensor values may be null to simulate failures
* Data is continuously updated in the background
* Domain can be switched dynamically

Response example

```
{
  "source": "external_org_stream",
  "domain": "agriculture",
  "data": {
    "deviceId": "D1002",
    "timestamp": 1719999999999,
    "temperature": 31.2,
    "humidity": null,
    "water_level": 18.4
  }
}
```


### Change Simulated Domain

Endpoint
POST /api/simulator/domain

What it does
Switches the active domain used by the simulator at runtime.

Request body

```
{
  "domain": "industrial"
}
```

Valid domains

* agriculture
* industrial
* energy
* healthcare

Response

```
{
  "status": "success",
  "simulated_domain": "industrial"
}
```



### Get Current Data Schema

Endpoint
GET /api/schema

What it does
Returns the inferred schema of the currently simulated data packet, including null fields.

Response example

```
{
  "source": "external_org_stream",
  "schema": {
    "temperature": "number",
    "vibration": "number",
    "current": "null",
    "acoustic": "number"
  }
}
```



## 2. DataHeal Engine Service

This is the core intelligence layer responsible for data healing, policy decisions, and trust-aware inference.

Base URL
[http://localhost:5001](http://localhost:5001)

### Heal Sensor Data

Endpoint
POST /heal

What it does
Accepts raw sensor values, applies policy-controlled healing, and returns healed data along with decision metadata.

Key behaviors

* Missing values must be sent as null
* Healing may or may not occur depending on policy
* Response always includes the reasoning behind the decision

Request body

```
{
  "temperature": 32.5,
  "humidity": null,
  "water_level": 22.1
}
```

Response example

```
{
  "domain": "agriculture",
  "confidence": 1.0,
  "mode": "expert_inference",
  "policy": {
    "strategy": "MODEL_INFERENCE",
    "threshold": 0.6,
    "domain_trust": 0.81
  },
  "data": {
    "temperature": 32.5,
    "humidity": 54.7,
    "water_level": 22.1
  }
}
```

Possible policy strategies

* PASSTHROUGH
* LAST_KNOWN
* MODEL_INFERENCE

Possible modes

* warmup
* policy_passthrough
* policy_last_known
* expert_inference

## 3. Backend Orchestrator Service

This service coordinates data flow between the external stream, DataHeal engine, and persistence layer.

Base URL
[http://localhost:5000](http://localhost:5000)

### Fetch, Heal, and Return Data

Endpoint
GET /api/external/fetch-heal

What it does
Fetches the latest sensor data from the simulator, sends it to the DataHeal engine, and returns both raw and healed data in a single response.

Behavior notes

* Acts as a single entry point for end-to-end validation
* Does not modify healing logic
* Preserves raw data for auditability

Response example

```
{
  "status": "fetched_and_healed",
  "meta": {
    "deviceId": "D1003",
    "timestamp": 1719999999999,
    "recordId": null
  },
  "raw": {
    "temperature": 33.1,
    "humidity": null,
    "water_level": 20.9
  },
  "healed": {
    "domain": "agriculture",
    "confidence": 1.0,
    "mode": "expert_inference",
    "policy": {
      "strategy": "MODEL_INFERENCE",
      "threshold": 0.6,
      "domain_trust": 0.79
    },
    "data": {
      "temperature": 33.1,
      "humidity": 56.2,
      "water_level": 20.9
    }
  }
}
```

### Health Check

Endpoint
GET /

What it does
Verifies that the backend service is running.

Response

```
DataGuard Backend is Running
```

## Notes on API Design

* APIs are internal contracts, not public SDKs
* No endpoint performs silent modification
* All healing actions are explainable
* Safe passthrough is always available
* Policy decisions are observable in responses

