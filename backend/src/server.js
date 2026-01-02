const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const contactRoutes = require('./routes/contact');
const { startKeepAlive } = require('./utils/keepAlive');
const connectDB = require('./config/db');
const contactLimiter = require('./middleware/rateLimiter');

dotenv.config();

const app = express();
// MongoDB Connect
connectDB();


const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// server.js के top में
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}


// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (CRITICAL for keep-alive)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    message: 'Softzen Backend is running! 🚀'
  });
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

// Routes
app.use('/api/contact', contactLimiter, contactRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Softzen Backend API',
    status: 'active',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      ping: '/ping',
      contact: '/api/contact'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Softzen Backend Server Started`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
  console.log(`📬 Contact: http://localhost:${PORT}/api/contact`);
  console.log('='.repeat(50));
  
  // Start self-ping to keep server alive
  startKeepAlive();
});

module.exports = app;