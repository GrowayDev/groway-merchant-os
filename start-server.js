#!/usr/bin/env node
/**
 * Server Starter - Starts Next.js dev server as a detached daemon
 * Usage: node start-server.js
 * Logs to: dev.log
 */
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const logFile = path.join(__dirname, 'dev.log')

// Clear previous log and cache
try { fs.unlinkSync(logFile) } catch {}
try { fs.rmSync(path.join(__dirname, '.next', 'cache'), { recursive: true }) } catch {}
try { fs.rmSync(path.join(__dirname, '.next', 'dev'), { recursive: true }) } catch {}

const logFd = fs.openSync(logFile, 'w')

const child = spawn('bunx', ['next', 'dev', '-p', '3000', '--webpack'], {
  cwd: __dirname,
  stdio: [logFd, logFd, logFd],
  detached: true,
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=2048'
  }
})

child.unref()
console.log(`Server started (PID: ${child.pid}), logging to ${logFile}`)
process.exit(0)
