// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from './config/passport';
import sessionConfig, { SessionService } from './config/session';

import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth';
import passwordResetRoutes from './routes/passwordReset';
import healthRoutes from './routes/health';
import ipRoutes from './routes/ip';
import organizationRoutes from './routes/organization';
import monitoringRoutes from './routes/monitoring';
import dashboardRoutes from './routes/dashboard';
import logsRoutes from './routes/logs';
import systemLogsRoutes from './routes/systemLogs';
import settingsRoutes from './routes/settings';
import scanRoutes from './routes/scan';
import { subnetRoutes } from './routes/subnetting';
import { topologyRoutes } from './routes/topology';
import passwordRoutes from './routes/passwords';
import autoSaveRoutes from './routes/autoSave';
import networkRoutes from './routes/network';
import agentlessMonitoringRoutes from './routes/agentlessMonitoring';
import zabbixRoutes from './routes/zabbix';
import systemRoutes from './routes/system';
import databaseRoutes from './routes/database';
import auth2faRoutes from './routes/auth2fa';

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session(sessionConfig));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Start session cleanup service
const sessionService = SessionService.getInstance();
sessionService.startCleanup();

// Activity logging middleware - Add logActivity method to request
app.use((req: any, res, next) => {
  const { ActivityLogService } = require('./services/activityLogService');
  const { LogStatus } = require('./config/logConfig');
  
  req.logActivity = async (
    action: string,
    resourceType: string,
    details?: Record<string, any>,
    status?: string
  ) => {
    try {
      const username = req.user?.username || req.user?.email || 'anonymous';
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('User-Agent');

      await ActivityLogService.log({
        username,
        action,
        resourceType,
        details: details || { method: req.method, path: req.path },
        ipAddress,
        userAgent,
        status: status || LogStatus.SUCCESS
      });
    } catch (error) {
      logger.error('Failed to log activity:', error);
    }
  };
  
  next();
});

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/auth/2fa', auth2faRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/ip', ipRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/system-logs', systemLogsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/subnetting', subnetRoutes);
app.use('/api/topology', topologyRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/autosave', autoSaveRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/agentless', agentlessMonitoringRoutes);
app.use('/api/zabbix', zabbixRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/database', databaseRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Try to connect to database (optional in development)
    try {
      await connectDatabase();
      logger.info('✅ Database connected successfully');
      
      // Run pending migrations automatically
      const MigrationManager = (await import('./services/migrationManager')).default;
      await MigrationManager.runPendingMigrations();
    } catch (dbError) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('⚠️  Database connection failed, running in development mode without database');
        logger.warn('Some features requiring database will not work');
      } else {
        throw dbError;
      }
    }
    
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;