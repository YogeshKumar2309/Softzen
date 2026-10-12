const mongoose = require('mongoose');

const connectDB = async () => {
  // 👇 Debug - check karne ke liye
  console.log('🔍 MONGO_URI:', process.env.MONGODB_URI ? 'Loaded ✅' : 'NOT LOADED ❌');

  if (!process.env.MONGO_URI) {
    console.error('❌ MONGODB_URI is missing in .env file');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;