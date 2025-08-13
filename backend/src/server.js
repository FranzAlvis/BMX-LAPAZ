const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const riderRoutes = require('./routes/riders');
const categoryRoutes = require('./routes/categories');
const registrationRoutes = require('./routes/registrations');
const raceRoutes = require('./routes/races');
const resultRoutes = require('./routes/results');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimiter);

// Make Prisma and Socket.IO available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  req.io = io;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'BMX Racing API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/races', raceRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-event', (eventId) => {
    socket.join(`event-${eventId}`);
    console.log(`Client ${socket.id} joined event ${eventId}`);
  });

  socket.on('join-race', (raceId) => {
    socket.join(`race-${raceId}`);
    console.log(`Client ${socket.id} joined race ${raceId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Process terminated');
  });
});

server.listen(PORT, () => {
  console.log(`🏁 BMX Racing API server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
