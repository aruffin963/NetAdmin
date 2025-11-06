import { Router, Request, Response } from 'express';
import { pool, redisClient } from '../config/database';

const router = Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthCheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    // Test database connection
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      healthCheck.services.database = 'healthy';
    } catch (error) {
      healthCheck.services.database = 'unhealthy';
    }

    // Test Redis connection
    try {
      await redisClient.ping();
      healthCheck.services.redis = 'healthy';
    } catch (error) {
      healthCheck.services.redis = 'unhealthy';
    }

    const status = Object.values(healthCheck.services).every(service => service === 'healthy') ? 200 : 503;

    res.status(status).json({
      success: status === 200,
      data: healthCheck,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

export default router;