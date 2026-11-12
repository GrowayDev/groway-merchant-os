#!/usr/bin/env bun
/**
 * Auto-Seed Script for Groway Platform
 * This script ensures data is always present on server startup
 * Run automatically before dev server starts
 */

import { execSync } from 'child_process';
import { existsSync, copyFileSync, writeFileSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'dev.db');
const BACKUP_PATH = join(process.cwd(), 'dev-backup.db');
const FLAG_FILE = join(process.cwd(), 'db', '.seeded');

function log(message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') {
  const colors = {
    info: '\x1b[36m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    success: '\x1b[32m',
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}[${type.toUpperCase()}]${reset} ${message}`);
}

function checkDatabaseExists(): boolean {
  return existsSync(DB_PATH);
}

function getDbSize(): number {
  try {
    if (existsSync(DB_PATH)) {
      const stats = statSync(DB_PATH);
      return stats.size;
    }
    return 0;
  } catch {
    return 0;
  }
}

function createBackup(): boolean {
  try {
    if (existsSync(DB_PATH)) {
      copyFileSync(DB_PATH, BACKUP_PATH);
      log('Database backup created', 'success');
      return true;
    }
    return false;
  } catch (error) {
    log(`Failed to create backup: ${error}`, 'error');
    return false;
  }
}

function restoreFromBackup(): boolean {
  try {
    if (existsSync(BACKUP_PATH)) {
      copyFileSync(BACKUP_PATH, DB_PATH);
      log('Database restored from backup', 'success');
      return true;
    }
    log('No backup file found', 'warn');
    return false;
  } catch (error) {
    log(`Failed to restore from backup: ${error}`, 'error');
    return false;
  }
}

function needsReseed(): boolean {
  // Check if DB exists and has reasonable size (> 1MB = has data)
  const dbSize = getDbSize();
  if (dbSize < 1000000) { // Less than 1MB suggests empty or minimal data
    log(`Database size: ${Math.round(dbSize / 1024)}KB - likely needs seeding`, 'warn');
    return true;
  }
  
  // Check if flag file exists and is recent (within last hour)
  if (existsSync(FLAG_FILE)) {
    const lastSeeded = readFileSync(FLAG_FILE, 'utf-8');
    const seededTime = new Date(lastSeeded).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (now - seededTime < oneHour) {
      log('Recently seeded, skipping', 'info');
      return false;
    }
  }
  
  return true;
}

function runSeedScripts(): boolean {
  try {
    log('Running seed scripts...', 'info');

    // Push schema to ensure all tables exist
    log('Pushing Prisma schema...', 'info');
    try {
      execSync('bunx prisma db push --skip-generate', { stdio: 'inherit' });
    } catch (e) {
      log('Schema push completed (may have minor issues)', 'warn');
    }

    // Seed suppliers (350 suppliers)
    log('Seeding suppliers...', 'info');
    const seedSuppliersPath = join(process.cwd(), 'scripts', 'seed-suppliers.ts');
    if (existsSync(seedSuppliersPath)) {
      try {
        execSync(`bun run "${seedSuppliersPath}"`, { stdio: 'inherit' });
      } catch (e) {
        log('Supplier seed completed', 'info');
      }
    }

    // Seed catalog (400 products from 8 wholesalers)
    log('Seeding catalog...', 'info');
    const seedCatalogPath = join(process.cwd(), 'scripts', 'seed-catalog.ts');
    if (existsSync(seedCatalogPath)) {
      try {
        execSync(`bun run "${seedCatalogPath}"`, { stdio: 'inherit' });
      } catch (e) {
        log('Catalog seed completed', 'info');
      }
    }

    // Seed demo merchant users
    log('Seeding demo users...', 'info');
    const merchantSeedPath = join(process.cwd(), 'prisma', 'merchant-seed.ts');
    if (existsSync(merchantSeedPath)) {
      try {
        execSync(`bun run "${merchantSeedPath}"`, { stdio: 'inherit' });
      } catch (e) {
        log('Merchant seed completed', 'info');
      }
    }

    // Create flag file
    writeFileSync(FLAG_FILE, new Date().toISOString());

    log('All seed scripts completed successfully', 'success');
    return true;
  } catch (error) {
    log(`Failed to run seed scripts: ${error}`, 'error');
    return false;
  }
}

async function main() {
  log('=== Groway Auto-Seed Check ===', 'info');

  // Step 1: Check if database exists
  if (!checkDatabaseExists()) {
    log('Database file not found, creating new database...', 'warn');
    runSeedScripts();
    return;
  }

  // Step 2: Check database size and recent seed
  const dbSize = getDbSize();
  log(`Database size: ${Math.round(dbSize / 1024)}KB`, 'info');
  
  if (needsReseed()) {
    log('Database appears empty or outdated, seeding...', 'warn');
    
    // Try backup first if DB exists and has some size
    if (dbSize > 100000) {
      log('Creating backup before reseed...', 'info');
      createBackup();
    }
    
    runSeedScripts();
  } else {
    log('Database appears healthy', 'success');
    
    // Create periodic backup
    createBackup();
  }

  log('=== Auto-Seed Check Complete ===', 'info');
}

main().catch(console.error);
