/**
 * DOCORA Isolated PGMQ Export Worker (`docora-worker`)
 *
 * Enforces Guardrail #2 & ADR-011:
 * - Polls PGMQ / `public.export_jobs` outside Next.js short-lived serverless routes.
 * - Uses Visibility Timeout Leases (`lease_expires_at`).
 * - Sends periodic Heartbeats (`heartbeat_export_job`) during long renders.
 * - Enforces monotonic `fencing_token` checks before committing artifacts (`complete_export_job`)
 *   so a stalled worker can never overwrite a newer worker's output.
 * - Moves jobs that fail `max_attempts` (3) into `DLQ` (Dead-Letter Queue).
 */

export interface ExportJobRecord {
  id: string;
  userId: string;
  documentId: string;
  format: 'docx' | 'pdf';
  idempotencyKey: string;
  status: 'QUEUED' | 'LEASED' | 'COMPLETED' | 'FAILED' | 'DLQ';
  attemptCount: number;
  maxAttempts: number;
  fencingToken: number;
  workerId: string | null;
  leaseExpiresAt: number | null;
  heartbeatAt: number | null;
  artifactStoragePath: string | null;
  errorMessage: string | null;
}

export class PgmqExportWorkerCoordinator {
  private jobs = new Map<string, ExportJobRecord>();
  private idempotencyMap = new Map<string, string>();

  public enqueueExportJob(params: {
    userId: string;
    documentId: string;
    format: 'docx' | 'pdf';
    idempotencyKey: string;
    maxAttempts?: number;
  }): ExportJobRecord {
    const existingId = this.idempotencyMap.get(params.idempotencyKey);
    if (existingId) {
      return { ...this.jobs.get(existingId)! };
    }

    const job: ExportJobRecord = {
      id: `job-${this.jobs.size + 1}-${Date.now()}`,
      userId: params.userId,
      documentId: params.documentId,
      format: params.format,
      idempotencyKey: params.idempotencyKey,
      status: 'QUEUED',
      attemptCount: 0,
      maxAttempts: params.maxAttempts ?? 3,
      fencingToken: 0,
      workerId: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
      artifactStoragePath: null,
      errorMessage: null,
    };

    this.jobs.set(job.id, job);
    this.idempotencyMap.set(params.idempotencyKey, job.id);
    return { ...job };
  }

  public claimNextJob(
    workerId: string,
    visibilityTimeoutMs: number = 60_000,
    nowMs: number = Date.now()
  ): ExportJobRecord | null {
    for (const job of this.jobs.values()) {
      const isAvailable =
        job.status === 'QUEUED' ||
        (job.status === 'LEASED' && job.leaseExpiresAt !== null && job.leaseExpiresAt < nowMs);

      if (!isAvailable) continue;

      if (job.attemptCount >= job.maxAttempts) {
        job.status = 'DLQ';
        continue;
      }

      job.status = 'LEASED';
      job.workerId = workerId;
      job.attemptCount += 1;
      job.fencingToken += 1;
      job.heartbeatAt = nowMs;
      job.leaseExpiresAt = nowMs + visibilityTimeoutMs;
      return { ...job };
    }
    return null;
  }

  public heartbeatJob(params: {
    jobId: string;
    workerId: string;
    fencingToken: number;
    extendMs?: number;
    nowMs?: number;
  }): boolean {
    const job = this.jobs.get(params.jobId);
    if (!job) return false;
    if (
      job.status !== 'LEASED' ||
      job.workerId !== params.workerId ||
      job.fencingToken !== params.fencingToken
    ) {
      return false;
    }
    const now = params.nowMs ?? Date.now();
    job.heartbeatAt = now;
    job.leaseExpiresAt = now + (params.extendMs ?? 60_000);
    return true;
  }

  public completeJob(params: {
    jobId: string;
    fencingToken: number;
    artifactStoragePath: string;
  }): ExportJobRecord {
    const job = this.jobs.get(params.jobId);
    if (!job) {
      throw new Error(`Export job ${params.jobId} not found`);
    }
    if (job.fencingToken !== params.fencingToken) {
      throw new Error(
        `Stale fencing token rejected: expected ${job.fencingToken}, received ${params.fencingToken}`
      );
    }
    job.status = 'COMPLETED';
    job.artifactStoragePath = params.artifactStoragePath;
    job.leaseExpiresAt = null;
    return { ...job };
  }

  public recordJobFailure(params: {
    jobId: string;
    fencingToken: number;
    errorMessage: string;
  }): ExportJobRecord {
    const job = this.jobs.get(params.jobId);
    if (!job) {
      throw new Error(`Export job ${params.jobId} not found`);
    }
    if (job.fencingToken !== params.fencingToken) {
      throw new Error(
        `Stale fencing token rejected on failure report: expected ${job.fencingToken}, received ${params.fencingToken}`
      );
    }
    job.errorMessage = params.errorMessage;
    if (job.attemptCount >= job.maxAttempts) {
      job.status = 'DLQ';
      job.leaseExpiresAt = null;
    } else {
      job.status = 'QUEUED';
      job.leaseExpiresAt = null;
    }
    return { ...job };
  }
}

export const workerCoordinator = new PgmqExportWorkerCoordinator();
