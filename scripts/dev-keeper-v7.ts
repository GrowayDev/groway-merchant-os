#!/usr/bin/env bun
/**
 * Groway Dev Keeper v7.1
 * Supervises the Next.js dev server on port 3000.
 * - 120s startup grace before health enforcement (compile can be slow)
 * - Health check every 15s thereafter
 * - Two consecutive failures + 60s cooldown before restore
 * - Wipes .next only when restoring (Turbopack corruption guard)
 */

import { spawn } from 'child_process';

const PROJECT = '/home/z/my-project';
const LOG = `${PROJECT}/dev-keeper.log`;
const PORT = 3000;
const START_GRACE_MS = 360000;
const CHECK_INTERVAL_MS = 15000;
const RESPAWN_COOLDOWN_MS = 60000;

let lastRespawn = 0;
let bootTime = Date.now();
let failStreak = 0;
let restoreCount = 0;
let child: any = null;

function log(msg: string) {
  const line = `[keeper ${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    require('fs').appendFileSync(LOG, line + '\n');
  } catch {}
}

function isHealthy(): Promise<boolean> {
  return new Promise((resolve) => {
    fetch(`http://localhost:${PORT}/`, { signal: AbortSignal.timeout(5000) })
      .then((r) => resolve(r.status < 500))
      .catch(() => resolve(false));
  });
}

function killStale() {
  try {
    const out = Bun.spawnSync(['bash', '-c', "pgrep -f 'next dev -p 3000' | grep -v $$ || true"], { cwd: PROJECT });
    for (const pid of out.stdout.toString().trim().split('\n').filter(Boolean)) {
      try {
        process.kill(Number(pid), 'SIGKILL');
        log(`killed stale next pid ${pid}`);
      } catch {}
    }
  } catch {}
}

function wipeCache() {
  try {
    Bun.spawnSync(['bash', '-c', `rm -rf ${PROJECT}/.next`], { cwd: PROJECT });
    log('.next cache wiped');
  } catch {}
}

function startDev() {
  log('spawning next dev (heap 1024MB)...');
  child = spawn(
    'bash',
    ['-c', 'cd /home/z/my-project && NODE_OPTIONS="--max-old-space-size=768" exec node node_modules/next/dist/bin/next dev -p 3000 >> /home/z/my-project/dev-server.log 2>&1'],
    { cwd: PROJECT, detached: false, stdio: ['ignore', 'ignore', 'ignore'] }
  );
  child.on('exit', (code: number) => {
    log(`next dev exited with code ${code}`);
    child = null;
  });
}

async function restore() {
  const now = Date.now();
  if (now - lastRespawn < RESPAWN_COOLDOWN_MS) {
    log('unhealthy but within respawn cooldown — waiting');
    return;
  }
  lastRespawn = now;
  failStreak = 0;
  log('RESTORING dev server');
  if (child) {
    try {
      child.kill('SIGKILL');
    } catch {}
    child = null;
  }
  killStale();
  // wait for port 3000 to free up (killed processes release asynchronously)
  for (let i = 0; i < 10; i++) {
    const free = await new Promise<boolean>((resolve) => {
      const net = require('net');
      const srv = net.createServer();
      srv.once('error', () => resolve(false));
      srv.once('listening', () => { srv.close(); resolve(true); });
      srv.listen(PORT, () => {});
    });
    if (free) break;
    log('port 3000 still held — waiting...');
    await new Promise((r) => setTimeout(r, 1000));
  }
  wipeCache();
  bootTime = now;
  startDev();
}

async function main() {
  log('=== Dev Keeper v7.1 started ===');
  try {
    require('fs').writeFileSync('/home/z/my-project/dev-keeper.pid', String(process.pid));
  } catch {}
  killStale();
  lastRespawn = Date.now();
  bootTime = lastRespawn;
  startDev();

  setInterval(async () => {
    const healthy = await isHealthy();
    if (healthy) {
      failStreak = 0;
      return;
    }
    // Startup grace: give the fresh server time to compile before enforcing
    if (Date.now() - bootTime < START_GRACE_MS) {
      log(`warming up (${Math.round((Date.now() - bootTime) / 1000)}s)...`);
      return;
    }
    failStreak++;
    log(`unhealthy x${failStreak}`);
    if (failStreak >= 2) await restore();
  }, CHECK_INTERVAL_MS);
}

main();
