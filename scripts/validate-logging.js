#!/usr/bin/env node

/**
 * Script de validation du logging cohérent
 * 
 * Usage: node validate-logging.js [options]
 * 
 * Options:
 *   --route <file>    Vérifier une route spécifique
 *   --all             Vérifier tous les fichiers de routes
 *   --fix             Tenter de corriger les problèmes (non-implémenté)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {Object} ValidationIssue
 * @property {'error' | 'warning' | 'info'} type
 * @property {number} [line]
 * @property {string} message
 */

/**
 * @typedef {Object} ValidationResult
 * @property {string} file
 * @property {ValidationIssue[]} issues
 * @property {number} score
 */

const ROUTES_DIR = path.join(__dirname, 'backend', 'src', 'routes');
const LOG_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'LIST',
  'EXPORT',
  'IMPORT',
  'ENABLE_2FA',
  'DISABLE_2FA',
  'VERIFY_2FA',
  'VIEW_DASHBOARD',
  'RUN_REPORT',
  'START',
  'STOP',
  'RESTART',
  'BACKUP',
  'RESTORE',
];

const RESOURCE_TYPES = [
  'USER',
  'ACCOUNT',
  'DEVICE',
  'SERVER',
  'NETWORK',
  'SUBNET',
  'VLAN',
  'SERVICE',
  'APPLICATION',
  'DATABASE',
  'ALERT',
  'ORGANIZATION',
  'SETTING',
  'SESSION',
  'TWO_FA',
  'BACKUP_CODE',
  'REPORT',
  'PAGE',
  'MONITORING',
];

/**
 * @param {string} filePath
 * @returns {ValidationResult}
 */
function validateFile(filePath) {
  const result = {
    file: path.relative(ROUTES_DIR, filePath),
    issues: [],
    score: 100,
  };

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Check 1: Import logConfig
  const hasLogConfigImport =
    content.includes("from '../config/logConfig'") ||
    content.includes('from "../config/logConfig"');

  if (!hasLogConfigImport && content.includes('router.')) {
    result.issues.push({
      type: 'error',
      message: 'Missing import: LogActions, ResourceTypes from ../config/logConfig',
    });
    result.score -= 20;
  }

  // Check 2: Usage of LogActions
  const logActionsUsed = LOG_ACTIONS.filter(
    (action) =>
      content.includes(`LogActions.${action}`) ||
      content.includes(`'${action}'`) ||
      content.includes(`"${action}"`)
  );

  if (logActionsUsed.length === 0 && content.includes('router.')) {
    result.issues.push({
      type: 'warning',
      message: 'No log actions found in this file',
    });
    result.score -= 15;
  }

  // Check 3: Usage of req.logActivity
  const hasReqLogActivity = content.includes('req.logActivity');
  const routerCount = (content.match(/router\.(get|post|put|delete|patch)/g) || [])
    .length;

  if (!hasReqLogActivity && routerCount > 0) {
    result.issues.push({
      type: 'warning',
      message: `Found ${routerCount} route(s) but no req.logActivity calls`,
    });
    result.score -= 25;
  }

  // Check 4: Proper error handling
  const hasTryCatch =
    (content.match(/try\s*{/g) || []).length > 0;
  const hasErrorLog = content.includes('} catch') && content.includes('LogStatus.ERROR');

  if (hasTryCatch && !hasErrorLog) {
    result.issues.push({
      type: 'warning',
      message: 'Found try-catch but no error logging with LogStatus.ERROR',
    });
    result.score -= 10;
  }

  // Check 5: Hardcoded action strings (anti-pattern)
  const hardcodedActions = lines.filter((line, idx) => {
    return (
      (line.includes("'CREATE'") ||
        line.includes("'UPDATE'") ||
        line.includes("'DELETE'") ||
        line.includes("'READ'") ||
        line.includes("'LIST'")) &&
      !line.includes('LogActions.') &&
      !line.includes('//') &&
      !line.includes('/*')
    );
  });

  if (hardcodedActions.length > 0) {
    result.issues.push({
      type: 'warning',
      message: `Found ${hardcodedActions.length} hardcoded action string(s). Use LogActions enum instead.`,
    });
    result.score -= 5 * hardcodedActions.length;
  }

  // Check 6: Details object includes resource IDs
  const logActivityCalls = content.match(/await\s+\(\s*req\s+as\s+any\s*\)\.logActivity\([^)]*\)/g);
  if (logActivityCalls && logActivityCalls.length > 0) {
    const detailsGood = logActivityCalls.filter((call) => call.includes('Id') || call.includes('id'))
      .length;
    if (detailsGood === 0 && logActivityCalls.length > 3) {
      result.issues.push({
        type: 'info',
        message: 'Consider including resource IDs in log details for better traceability',
      });
      result.score -= 3;
    }
  }

  // Score bounds
  result.score = Math.max(0, Math.min(100, result.score));

  return result;
}

/**
 * @returns {ValidationResult[]}
 */
function validateAllRoutes() {
  const routeFiles = fs
    .readdirSync(ROUTES_DIR)
    .filter((file) => file.endsWith('.ts'));

  return routeFiles.map((file) => {
    const filePath = path.join(ROUTES_DIR, file);
    return validateFile(filePath);
  });
}

/**
 * @param {ValidationResult[]} results
 */
function printResults(results) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║          LOGGING VALIDATION REPORT                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const sortedResults = results.sort((a, b) => a.score - b.score);

  for (const result of sortedResults) {
    const status = result.score >= 80 ? '✓' : result.score >= 60 ? '⚠' : '✗';
    const color = result.score >= 80 ? '\x1b[32m' : result.score >= 60 ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(
      `${color}${status}${reset} ${result.file.padEnd(40)} [${result.score
        .toString()
        .padStart(3)}%]`
    );

    for (const issue of result.issues) {
      const icon = issue.type === 'error' ? '✗' : issue.type === 'warning' ? '⚠' : 'ℹ';
      console.log(`    ${icon} ${issue.message}`);
    }
  }

  // Summary
  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / results.length
  );
  const excellentCount = results.filter((r) => r.score >= 80).length;
  const okCount = results.filter((r) => r.score >= 60 && r.score < 80).length;
  const poorCount = results.filter((r) => r.score < 60).length;

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log(`║  Average Score: ${avgScore.toString().padStart(3)}%                         ║`);
  console.log(
    `║  Excellent (80+): ${excellentCount.toString().padStart(2)}  Good (60-79): ${okCount
      .toString()
      .padStart(2)}  Needs Work: ${poorCount.toString().padStart(2)}         ║`
  );
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Recommendations
  if (avgScore < 80) {
    console.log('📋 Recommendations:\n');

    if (poorCount > 0) {
      console.log(`1. Fix ${poorCount} routes with poor logging (score < 60)`);
    }

    if (
      results.some((r) =>
        r.issues.some((i) => i.message.includes('Missing import'))
      )
    ) {
      console.log('2. Add logConfig imports to routes that are missing them');
    }

    if (
      results.some((r) =>
        r.issues.some((i) => i.message.includes('hardcoded'))
      )
    ) {
      console.log('3. Replace hardcoded action strings with LogActions enum');
    }

    console.log('\nFor help, see:\n');
    console.log('  - LOGGING_GUIDE.md');
    console.log('  - LOGGING_INTEGRATION_GUIDE.md');
    console.log('  - backend/src/config/logConfig.ts\n');
  } else {
    console.log('✓ Excellent! Your logging system is well-implemented.\n');
  }
}

// Main
const args = process.argv.slice(2);

if (args.includes('--all') || args.length === 0) {
  const results = validateAllRoutes();
  printResults(results);
} else if (args.includes('--route')) {
  const routeIdx = args.indexOf('--route');
  const routeName = args[routeIdx + 1];

  if (!routeName) {
    console.error('Error: --route requires a filename argument');
    process.exit(1);
  }

  const routePath = path.join(ROUTES_DIR, routeName);
  if (!fs.existsSync(routePath)) {
    console.error(`Error: Route file not found: ${routePath}`);
    process.exit(1);
  }

  const result = validateFile(routePath);
  printResults([result]);
} else {
  console.log('Usage: node validate-logging.js [--all|--route <file>]');
  process.exit(1);
}
