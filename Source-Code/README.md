---
title: DataGuard - DataHeal Server
emoji: 🛡️
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# DataGuard - DataHeal Server

An AI-powered self-healing data pipeline that detects and repairs corrupted, missing, or anomalous sensor data in real-time using LSTM expert models.

## API Usage

Send a POST request to `/heal` with sensor data:

```bash
curl -X POST https://your-space.hf.space/heal \
  -H "Content-Type: application/json" \
  -d '{"temperature": 25.3, "humidity": null, "water_level": 4.5}'
```

## Supported Domains

- **Agriculture**: temperature, humidity, water_level
- **Energy**: voltage, current, frequency, power
- **Healthcare**: heart_rate, spo2, body_temperature
- **Industrial**: temperature, vibration, current, acoustic
