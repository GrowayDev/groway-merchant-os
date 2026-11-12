import { NextResponse } from 'next/server';
import { checkAndRestoreData, getDataStatus } from '@/lib/data-guard';
import { execSync } from 'child_process';

/**
 * GET /api/data-status
 * Check current data status and health
 */
export async function GET() {
  try {
    const status = getDataStatus();
    const { tables } = await checkAndRestoreData();

    return NextResponse.json({
      success: true,
      data: {
        dbExists: status.dbExists,
        backupExists: status.backupExists,
        lastSeeded: status.lastSeeded,
        tables: tables.map(t => ({
          name: t.name,
          count: t.count,
          minRequired: t.minRequired,
          isHealthy: t.isHealthy
        })),
        isHealthy: tables.every(t => t.isHealthy)
      }
    });
  } catch (error) {
    console.error('Error checking data status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check data status'
    }, { status: 500 });
  }
}

/**
 * POST /api/data-status
 * Trigger data restore/reseed
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'check';

    if (action === 'restore') {
      const result = await checkAndRestoreData();
      return NextResponse.json({
        success: true,
        data: {
          wasHealthy: result.wasHealthy,
          wasRestored: result.wasRestored,
          tables: result.tables,
          message: result.wasRestored
            ? 'Data restored successfully'
            : 'Data was already healthy'
        }
      });
    }

    if (action === 'backup') {
      execSync('bun run scripts/backup-db.ts', { stdio: 'inherit' });
      return NextResponse.json({
        success: true,
        message: 'Backup created successfully'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "restore" or "backup"'
    }, { status: 400 });
  } catch (error) {
    console.error('Error in data action:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to perform action'
    }, { status: 500 });
  }
}
