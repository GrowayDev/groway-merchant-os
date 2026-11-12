/**
 * Next.js Instrumentation - Runs on server startup
 * Simplified to avoid blocking server startup
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Server starting...');
    // Skip data seeding on startup - it was blocking the server
    // Data will be seeded lazily when needed
    console.log('[Instrumentation] Ready');
  }
}
