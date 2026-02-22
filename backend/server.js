const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const authRoute = require('./routes/auth');
const deviceRoute = require('./routes/devices');

dotenv.config({ path: './.env' });

const app = express();
const EXTERNAL_ORG_LATEST_URL = process.env.EXTERNAL_ORG_LATEST_URL;
const HEAL_ENGINE_URL = process.env.HEAL_ENGINE_URL;
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(' MongoDB Connection Error:', err));

app.get("/api/external/fetch-heal", async (req, res) => {
  try {
    const extResp = await axios.get(`${EXTERNAL_ORG_LATEST_URL}/api/latest`, { timeout: 8000 });

    const extPacket = extResp.data?.data || {};

    const deviceId = extPacket.deviceId || null;
    const timestamp = extPacket.timestamp || Date.now();

    const { deviceId: _d, timestamp: _t, recordId, ...sensorData } = extPacket;

    const healResp = await axios.post(`${HEAL_ENGINE_URL}/heal`, sensorData, {
      timeout: 8000,
      headers: { "Content-Type": "application/json" },
    });

    return res.status(200).json({
      status: "fetched_and_healed",
      meta: {
        deviceId,
        timestamp,
        recordId: recordId || null,
      },
      raw: sensorData,
      healed: healResp.data,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err?.message || "internal error",
    });
  }
});

// Route Middlewares
app.use('/api/auth', authRoute);
app.use('/api/devices', deviceRoute);

app.get('/', (req, res) => {
  res.send('DataGuard Backend is Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});