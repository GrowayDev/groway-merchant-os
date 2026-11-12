#!/usr/bin/env bun
/**
 * Database Backup Script
 * Creates timestamped backups of the Groway database
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'db', 'groway.db');
const BACKUP_DIR = join(process.cwd(), 'db', 'backups');
const MAX_BACKUPS = 10; // Keep last 10 backups

function createBackup(): void {
  if (!existsSync(DB_PATH)) {
    console.error('❌ Database file not found');
    process.exit(1);
  }

  // Create backup directory
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Create timestamped backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(BACKUP_DIR, `groway-${timestamp}.db`);

  copyFileSync(DB_PATH, backupPath);
  console.log(`✅ Backup created: ${backupPath}`);

  // Clean old backups
  const backups = readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('groway-') && f.endsWith('.db'))
    .map(f => ({
      name: f,
      path: join(BACKUP_DIR, f),
      time: statSync(join(BACKUP_DIR, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  // Remove old backups
  if (backups.length > MAX_BACKUPS) {
    backups.slice(MAX_BACKUPS).forEach(backup => {
      unlinkSync(backup.path);
      console.log(`🗑️ Removed old backup: ${backup.name}`);
    });
  }

  console.log(`📦 Total backups: ${Math.min(backups.length, MAX_BACKUPS)}`);
}

createBackup();
