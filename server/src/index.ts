/**
 * KLAM.Online Server
 * Main entry point for the backend API server
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './db';
import authRoutes from './routes/auth';
import companyRoutes from './routes/companies';
import dictionaryRoutes from './routes/dictionaries';
import telegramRoutes from './routes/telegram';
import userRoutes from './routes/user';
import { initBot, stopBot } from './bot';
import { wsManager } from './websocket';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// =========================
// MIDDLEWARE
// =========================

// Security headers
app.use(helmet());

// CORS - разрешаем несколько origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://waldo-gamic-clark.ngrok-free.dev'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (например, мобильные приложения или curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn('⚠️ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// =========================
// ROUTES
// =========================

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const dbConnected = await testConnection();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
  });
});

// API version info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'KLAM.Online API',
    version: '1.0.0',
    environment: NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/dictionaries', dictionaryRoutes);
app.use('/api/telegram', telegramRoutes);

// TODO: Add more API routes here
// app.use('/api/projects', projectRoutes);
// app.use('/api/albums', albumRoutes);

// =========================
// ERROR HANDLING
// =========================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// =========================
// SERVER START
// =========================

async function startServer() {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      console.log('💡 Make sure MySQL is running and .env is configured correctly');
      process.exit(1);
    }

    // Create HTTP server and initialize WebSocket
    const httpServer = createServer(app);
    wsManager.initialize(httpServer);

    // Start server
    httpServer.listen(PORT, () => {
      console.log('');
      console.log('🚀 KLAM.Online Server');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket available on: ws://localhost:${PORT}/ws`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`✓ Database: Connected`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      // Инициализируем Telegram бота
      initBot();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  stopBot();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  stopBot();
  process.exit(0);
});

// Start the server
startServer();
