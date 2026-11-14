/**
 * Dev Keeper Daemon v6.3
 * Self-healing watchdog for the Next.js dev server (port 3000).
 * Spawned via the whatsapp-notification-service hot-reload hook so it
 * survives session reapers (the bun --hot mini-service outlives dev crashes).
 *
 * v6.3 fixes the respawn-loop bug:
 *  - Health timeout raised 6s -> 30s (Turbopack cold compiles take 19-25s;
 *    the old 6s timeout made every cold start look "unhealthy")
 *  - 120s warm-up grace after each spawn: failures are logged but never
 *    trigger a kill while the server is compiling its first pages
 *  - First respawn attempt does NOT wipe .next (keeps the compiled cache
 *    for a fast restart). Only if the server is still unhealthy after two
 *    consecutive post-warmup respawn cycles do we wipe .next (corruption
 *    suspected) — previously EVERY respawn wiped .next, guaranteeing slow
 *    cold starts and an infinite kill/respawn loop.
 *
 * Behavior:
 *  - Health-check http://localhost:3000 every 15s
 *  - If unhealthy (past warm-up): kill stale next-dev, optionally wipe
 *    .next, respawn `bun run dev` with 1280MB heap
 *  - 45s cooldown between respawn attempts (OOM guard)
 */

import { spawn } from 'child_process';
import { existsSync, rmSync, appendFileSync } from 'fs';
import http from 'http';

const KEEPER_LOG = '/home/z/my-project/dev-keeper.log';
const PROJECT = '/home/z/my-project';
const HEALTH_PORT = 3000;
const CHECK_INTERVAL_MS = 15_000;
const RESPAWN_COOLDOWN_MS = 45_000;
const HEALTH_TIMEOUT_MS = 30_000; // cold Turbopack compiles take 19-25s
const WARMUP_MS = 120_000;        // post-spawn grace before kills are allowed
const MAX_FAST_RESPAWNS = 2;      // respawns before we suspect cache corruption

function log(msg: string) {
  const line = `[KEEPER ${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(KEEPER_LOG, line + '\n'); } catch {}
}

function isHealthy(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(
      { host: '127.0.0.1', port: HEALTH_PORT, path: '/', timeout: HEALTH_TIMEOUT_MS },
      (res) => {
        resolve(typeof res.statusCode === 'number' && res.statusCode < 500);
        res.resume();
      }
    );
    // On timeout do NOT destroy the request: let the compile finish so the
    // result is cached and the next check is fast. Aborting mid-compile is
    // what caused Turbopack "Failed to restore task data" corruption.
    req.on('timeout', () => resolve(false));
    req.on('error', () => resolve(false));
  });
}

let respawning = false;
let lastRespawn = 0;
let lastSpawnAt = 0;          // 0 = never spawned by this keeper instance
let fastRespawns = 0;         // respawn cycles that kept the .next cache

async function respawn() {
  if (respawning) return;
  const now = Date.now();
  if (now - lastRespawn < RESPAWN_COOLDOWN_MS) {
    log(`Cooldown active, skipping respawn (${Math.ceil((RESPAWN_COOLDOWN_MS - (now - lastRespawn)) / 1000)}s left)`);
    return;
  }
  respawning = true;
  lastRespawn = now;
  try {
    log('Server unhealthy. Killing stale next-dev processes...');
    await new Promise<void>((resolve) => {
      const p = spawn('bash', ['-c', 'pkill -f "next dev -p 3000" 2>/dev/null; pkill -f "next-server" 2>/dev/null; sleep 2; true']);
      p.on('close', () => resolve());
      p.on('error', () => resolve());
    });

    // Only wipe the Turbopack cache when corruption is suspected (server
    // stayed unhealthy through MAX_FAST_RESPAWNS restarts). Wiping on every
    // respawn guaranteed slow cold starts and an infinite kill/respawn loop.
    const nextDir = `${PROJECT}/.next`;
    if (fastRespawns >= MAX_FAST_RESPAWNS && existsSync(nextDir)) {
      log(`Still unhealthy after ${fastRespawns} fast respawns — wiping .next (corruption suspected)...`);
      try { rmSync(nextDir, { recursive: true, force: true }); } catch (e) { log(`Cache wipe failed: ${e}`); }
      fastRespawns = 0;
    } else {
      fastRespawns++;
      log('Keeping .next cache for fast restart.');
    }

    log('Respawning dev server (heap 1280MB)...');
    const child = spawn(
      'bash',
      ['-c', 'cd /home/z/my-project && NODE_OPTIONS="--max-old-space-size=1280" exec bun run dev >> /home/z/my-project/dev-server.log 2>&1'],
      { detached: true, stdio: 'ignore' }
    );
    child.unref();
    lastSpawnAt = Date.now();
    log(`Spawned (pid ${child.pid}). Warm-up grace ${WARMUP_MS / 1000}s, health checks every ${CHECK_INTERVAL_MS / 1000}s.`);
  } finally {
    respawning = false;
  }
}

async function loop() {
  const healthy = await isHealthy();
  if (!healthy) {
    // Warm-up grace: right after a spawn the first page compiles can take
    // 19-25s each. Log failures but never kill during the grace window.
    const inWarmup = lastSpawnAt !== 0 && Date.now() - lastSpawnAt < WARMUP_MS;
    const failStreak = ((globalThis as any).__failStreak = ((globalThis as any).__failStreak || 0) + 1);
    if (inWarmup) {
      log(`Health check FAILED (${failStreak} consecutive) — warm-up grace active, not killing`);
    } else {
      log(`Health check FAILED (${failStreak} consecutive)`);
      if (failStreak >= 2) { // two consecutive failures = really down
        (globalThis as any).__failStreak = 0;
        await respawn();
      }
    }
  } else {
    (globalThis as any).__failStreak = 0;
  }
  setTimeout(loop, CHECK_INTERVAL_MS);
}

log('Dev Keeper Daemon v6.3 started');
setTimeout(loop, CHECK_INTERVAL_MS);
