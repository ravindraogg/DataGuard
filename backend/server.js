const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoute = require('./routes/auth');
const deviceRoute = require('./routes/devices');

dotenv.config({ path: './.env' }); 

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Route Middlewares
app.use('/api/auth', authRoute);
app.use('/api/devices', deviceRoute);

app.get('/', (req, res) => {
  res.send('DataGuard Backend is Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});