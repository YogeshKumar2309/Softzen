const mongoose = require('mongoose');
const dns = require('dns');

// ✅ DNS Fix — MongoDB Atlas SRV records ke liye
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  const uri = process.env.MONGODB_URL; // ✅ MONGODB_URL

  console.log('🔍 MONGODB_URL:', uri ? 'Loaded ✅' : 'NOT LOADED ❌');

  if (!uri) {
    console.error('❌ MONGODB_URL is missing in .env');
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