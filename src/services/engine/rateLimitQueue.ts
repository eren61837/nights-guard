export interface QueueTask<T> {
  id: string;
  description: string;
  execute: () => Promise<T>;
}

export interface QueueProgress {
  current: number;
  total: number;
  description: string;
  percent: number;
}

export class RateLimitQueue {
  private baseDelayMs: number;
  private maxRetries: number;

  constructor(baseDelayMs: number = 650, maxRetries: number = 4) {
    this.baseDelayMs = baseDelayMs;
    this.maxRetries = maxRetries;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async processAll<T>(
    tasks: QueueTask<T>[],
    onProgress?: (progress: QueueProgress) => Promise<void> | void
  ): Promise<T[]> {
    const results: T[] = [];
    const total = tasks.length;

    for (let i = 0; i < total; i++) {
      const task = tasks[i];
      let attempts = 0;
      let success = false;
      let lastError: any = null;

      if (onProgress) {
        const percent = Math.round(((i + 1) / total) * 100);
        await onProgress({
          current: i + 1,
          total,
          description: task.description,
          percent,
        });
      }

      while (attempts < this.maxRetries && !success) {
        try {
          attempts++;
          const result = await task.execute();
          results.push(result);
          success = true;
        } catch (error: any) {
          lastError = error;
          
          // Check for Discord rate limit (HTTP 429)
          const retryAfter = error?.retryAfter ?? error?.rawError?.retry_after ?? null;
          if (retryAfter) {
            const waitTime = Math.ceil(Number(retryAfter) * 1000) + 500;
            console.warn(`[RateLimitQueue] 429 Rate limit alındı. Bekleniyor: ${waitTime}ms (Görev: ${task.description})`);
            await this.sleep(waitTime);
          } else if (error?.status === 429 || error?.code === 429) {
            const waitTime = 2500 * attempts;
            console.warn(`[RateLimitQueue] 429 Algılandı. ${waitTime}ms bekleniyor...`);
            await this.sleep(waitTime);
          } else {
            console.error(`[RateLimitQueue] Görev hatası (${task.description}):`, error?.message || error);
            // Non-429 error (like missing permissions), wait briefly and either rethrow or break
            if (attempts >= this.maxRetries) {
              throw error;
            }
            await this.sleep(1000);
          }
        }
      }

      // Safe pause between successful operations to avoid triggering rate limits
      await this.sleep(this.baseDelayMs);
    }

    return results;
  }
}
