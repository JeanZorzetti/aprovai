export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startAnalysisWorker } = await import('@/lib/queue')
    startAnalysisWorker()
    console.log('[AprovAI] Analysis worker started')
  }
}
