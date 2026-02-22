import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 7000;
const DEVICE_IDS = ["D1001", "D1002", "D1003", "D1004"];

// --- Your New Generation Logic ---
const rand = (min, max) => Math.random() * (max - min) + min;
const maybeNull = (val) => (Math.random() < 0.05 ? null : val);

const generators = {
  agriculture: () => ({
    temperature: maybeNull(rand(20, 35)),
    humidity: maybeNull(rand(40, 90)),
    water_level: maybeNull(rand(10, 50))
  }),
  industrial: () => ({
    temperature: maybeNull(rand(50, 90)),
    vibration: maybeNull(rand(0, 5)),
    current: maybeNull(rand(10, 20)),
    acoustic: maybeNull(rand(40, 80))
  }),
  energy: () => ({
    voltage: maybeNull(rand(220, 240)),
    current: maybeNull(rand(5, 15)),
    frequency: maybeNull(rand(49, 51)),
    power: maybeNull(rand(1000, 3000))
  }),
  healthcare: () => ({
    heart_rate: maybeNull(rand(60, 100)),
    spo2: maybeNull(rand(95, 99)),
    body_temperature: maybeNull(rand(36, 37.5))
  })
};

// State for the latest packet
let currentDomain = "agriculture";
let latestPacket = {};

// Update Loop
setInterval(() => {
  const payload = generators[currentDomain]();
  latestPacket = {
    deviceId: DEVICE_IDS[Math.floor(Math.random() * DEVICE_IDS.length)],
    timestamp: Date.now(),
    ...payload
  };
}, 2000);

// --- Endpoints ---

// Endpoint to change the simulated domain on the fly
app.post("/api/simulator/domain", (req, res) => {
  const { domain } = req.body;
  if (generators[domain]) {
    currentDomain = domain;
    return res.json({ status: "success", simulated_domain: domain });
  }
  res.status(400).json({ error: "Invalid domain" });
});

app.get("/api/latest", (req, res) => {
  res.json({
    source: "external_org_stream",
    domain: currentDomain,
    data: latestPacket,
  });
});

app.get("/api/schema", (req, res) => {
  const schema = {};
  Object.keys(latestPacket).forEach(key => {
    schema[key] = latestPacket[key] === null ? "null" : typeof latestPacket[key];
  });
  res.json({ source: "external_org_stream", schema });
});

app.listen(PORT, () => {
  console.log(`Multi-Domain Simulator running at http://127.0.0.1:${PORT}`);
  console.log(`Currently simulating: ${currentDomain}`);
});