export interface RunPoolOptions {
  concurrency: number;
  isAborted: () => boolean;
}

/** 제한된 동시성으로 작업 목록을 처리한다. abort 시 새 작업은 시작하지 않되 진행 중인 작업은 완료한다. */
export async function runPool<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>,
  options: RunPoolOptions
): Promise<void> {
  let cursor = 0;

  async function runNext(): Promise<void> {
    while (cursor < items.length) {
      if (options.isAborted()) return;
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(options.concurrency, items.length) }, () =>
    runNext()
  );
  await Promise.all(workers);
}

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  isRetryable: (error: unknown) => boolean;
  isAborted?: () => boolean;
}

export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt > options.maxRetries || !options.isRetryable(error) || options.isAborted?.()) {
        throw error;
      }
      const delay = options.baseDelayMs * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
