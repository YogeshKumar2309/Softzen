const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contact');
const userRoutes = require('./routes/user');
const contactLimiter = require('./middleware/rateLimiter');
const { startKeepAlive } = require('./utils/keepAlive');

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

app.get('/ping', (req, res) => res.send('pong'));

// Routes
app.use('/api/contact', contactLimiter, contactRoutes);
app.use('/api/user', userRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Softzen Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      contact: '/api/contact',
      userRegister: '/api/user/register',
      userCount: '/api/user/count'
    }
  });
});

// 404
// ✅ सही - Express 5 compatible
app.use('/{*splat}', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Softzen Backend running on port ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
  startKeepAlive();
});

module.exports = app;