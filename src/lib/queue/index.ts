import { Queue, Worker } from 'bullmq'
import { processAnalysis } from './analysis-worker'
import IORedis from 'ioredis'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export const analysisQueue = new Queue('analysis', { connection })

let worker: Worker | null = null

export function startAnalysisWorker() {
  if (worker) return worker

  worker = new Worker(
    'analysis',
    async (job) => {
      console.log(`[Worker] Processing analysis ${job.data.analysisId}`)
      await processAnalysis(job.data.analysisId)
      console.log(`[Worker] Completed analysis ${job.data.analysisId}`)
    },
    {
      connection,
      concurrency: 3,
    }
  )

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message)
  })

  return worker
}

export async function enqueueAnalysis(analysisId: string) {
  await analysisQueue.add('process', { analysisId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  })
}
