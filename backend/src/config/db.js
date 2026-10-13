const mongoose = require('mongoose');
const dns = require('dns');

// ✅ DNS Fix — MongoDB Atlas SRV records ke liye
// Render/localhost dono par kaam karega
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  // Debug — env variable load hua ya nahi
  const uri = process.env.MONGODB_URI;

  console.log(
    '🔍 MONGODB_URI:',
    uri ? 'Loaded ✅' : 'NOT LOADED ❌'
  );

  if (!uri) {
    console.error('❌ MONGODB_URI is missing in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;