import { setTimeout as sleep } from 'node:timers/promises';

/**
 * @param options
 * @param [options.interval=100]
 * @param [options.timeout=5000]
 */
export async function waitFor<T>(
  action: () => T,
  options: { timeout?: number; interval?: number } = {},
): Promise<Awaited<T>> {
  const { interval = 100, timeout = 5_000 } = options;
  const signal = AbortSignal.timeout(timeout);

  return new Promise<any>((resolve, reject) => {
    let lastError: unknown;

    signal.addEventListener('abort', () => {
      reject(new Error(`Function timed-out ${options.timeout}`, { cause: lastError }));
    });

    const wrapper = (): Promise<unknown> =>
      Promise.resolve()
        .then(() => {
          if (signal.aborted) {
            reject(lastError);
            throw new Error();
          }

          return action();
        })
        .then(
          (value) => resolve(value),
          (error) => {
            if (signal.aborted) return;

            lastError = error;
            return sleep(interval).then(wrapper);
          },
        );

    return wrapper();
  });
}
