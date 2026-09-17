// Next.js instrumentation hook — runs once when the server process starts.
// Recovers intake items stuck in INCOMING status (e.g. after a crash or
// container restart dropped the in-memory triage queue).

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { processPendingIntakes, startIntakeQueueWorker } = await import('./lib/queue/intakeQueue');

  const MAX_ATTEMPTS = 5;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const recovered = await processPendingIntakes();
      startIntakeQueueWorker();
      if (recovered > 0) {
        console.log(`[startup] Recovered ${recovered} pending intake item(s) for AI triage`);
      }
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[startup] Intake recovery attempt ${attempt}/${MAX_ATTEMPTS} failed: ${message}`);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((res) => setTimeout(res, 3000 * attempt));
      }
    }
  }
  console.error('[startup] Intake recovery gave up — items in INCOMING status may need manual review');
}
