const axios = require("axios");

function rand(min, max) { return Math.random() * (max - min) + min; }
function maybeNull(val) { return Math.random() < 0.25 ? null : val; }

// Generators match the columns found in your actual CSV files
const generators = {
  agriculture: () => ({
    temperature: maybeNull(rand(20, 35)),
    humidity: maybeNull(rand(40, 90)),
    water_level: maybeNull(rand(10, 50)) // Mapped from soil_moisture
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

async function send() {
  const domains = Object.keys(generators);
  const type = domains[Math.floor(Math.random() * domains.length)];
  const payload = generators[type]();

  try {
    const res = await axios.post("http://127.0.0.1:5000/heal", payload);
    console.log(`[${type.toUpperCase()}] Mode: ${res.data.mode} | Domain: ${res.data.domain}`);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

setInterval(send, 500);