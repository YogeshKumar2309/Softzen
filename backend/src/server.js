const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contact');
const userRoutes = require('./routes/user');
const messageRoutes = require('./routes/message');
const contactLimiter = require('./middleware/rateLimiter');
const { startKeepAlive } = require('./utils/keepAlive');
const { initSocket } = require('./socket/chat');
const aiRoutes = require('./routes/ai');

dotenv.config();
connectDB().then(() => {
  ensureRiyaExists();
});

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Socket.io init karo
const io = initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.path !== '/ping' && req.path !== '/health') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

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
app.use('/api/message', messageRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Softzen Chat API',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/user/register',
      login: 'POST /api/user/login',
      count: 'GET /api/user/count',
      messages: 'GET /api/message/:roomId',
      socket: 'ws://localhost:' + PORT
    }
  });
});

app.use('/{*splat}', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// ⚠️ app.listen ki jagah server.listen karo (Socket.io ke liye)
server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Softzen Backend running on port ${PORT}`);
  console.log(`🌐 HTTP: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log('='.repeat(50));
  startKeepAlive();
});

module.exports = { app, io };