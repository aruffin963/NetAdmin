import { Router, Request, Response } from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * Calculer le pourcentage d'utilisation CPU
 */
function getCPUUsage(): number {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += (cpu.times as any)[type];
    }
    totalIdle += cpu.times.idle;
  }

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~(100 * idle / total);

  return Math.max(0, Math.min(100, usage));
}

/**
 * Calculer le pourcentage d'utilisation mémoire
 */
function getMemoryUsage(): number {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return Math.round((usedMem / totalMem) * 100 * 10) / 10;
}

/**
 * Obtenir l'utilisation disque (pour le disque racine)
 */
function getDiskUsage(): { used: number; total: number; percentage: number } {
  try {
    // Sous Windows, C: drive
    const driveRoot = process.platform === 'win32' ? 'C:' : '/';
    
    // Approximation - utilise fs.statfs si disponible
    // Sinon retourne des valeurs par défaut
    const stats = (fs as any).statfsSync ? (fs as any).statfsSync(driveRoot) : null;
    
    if (stats) {
      const total = stats.blocks * stats.bsize;
      const free = stats.bfree * stats.bsize;
      const used = total - free;
      const percentage = Math.round((used / total) * 100 * 10) / 10;
      
      return { used, total, percentage };
    }
  } catch (error) {
    // Silent fail
  }

  // Valeur par défaut si statfs n'est pas disponible
  return {
    used: 0,
    total: 0,
    percentage: 0,
  };
}

/**
 * GET /api/system/metrics
 * Obtenir les métriques système du PC local (CPU, Memory, Disk)
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const cpu = getCPUUsage();
    const memory = getMemoryUsage();
    const disk = getDiskUsage();
    
    const metrics = {
      timestamp: new Date().toISOString(),
      hostname: os.hostname(),
      platform: process.platform,
      uptime: os.uptime(),
      cpu: Math.round(cpu * 10) / 10,
      memory: memory,
      disk: disk.percentage,
      diskDetailed: disk,
      cores: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024) * 10) / 10, // GB
      freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024) * 10) / 10, // GB
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching system metrics',
      error: (error as Error).message,
    });
  }
});

export default router;
