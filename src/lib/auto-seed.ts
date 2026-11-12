/**
 * Auto-seed utility for ensuring data persistence across Turbopack cache clears
 * Call this from client components on initial load
 */

let seedChecked = false;

export async function ensureDataSeeded(): Promise<{
  success: boolean;
  results?: Record<string, unknown>;
  error?: string;
}> {
  // Only check once per session
  if (seedChecked) {
    return { success: true, results: { cached: true } };
  }

  try {
    const response = await fetch('/api/seed');
    const data = await response.json();

    if (data.success) {
      seedChecked = true;
      console.log('[AutoSeed] Data check completed:', data.results);
    }

    return data;
  } catch (error) {
    console.error('[AutoSeed] Error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Force re-seed (clears cached check)
 */
export function forceReseed() {
  seedChecked = false;
  return ensureDataSeeded();
}
