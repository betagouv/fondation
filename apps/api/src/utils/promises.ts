import { Logger } from '@nestjs/common';

export function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled';
}

export function isRejected(result: PromiseSettledResult<unknown>): result is PromiseRejectedResult {
  return result.status === 'rejected';
}

export function partitionSettled<T>(result: readonly PromiseSettledResult<T>[]): {
  fulfilled: PromiseFulfilledResult<T>[];
  rejected: PromiseRejectedResult[];
} {
  return result.reduce(
    (partition, r) => {
      if (r.status === 'fulfilled') {
        partition.fulfilled.push(r);
      } else {
        partition.rejected.push(r);
      }
      return partition;
    },
    {
      fulfilled: [] as PromiseFulfilledResult<T>[],
      rejected: [] as PromiseRejectedResult[],
    },
  );
}

const ignoreAsyncLogger = new Logger('ignoreAsync');
export function ignoreAsync(action: () => Promise<unknown>): void {
  process.nextTick(() => {
    action().catch((error) => {
      ignoreAsyncLogger.warn(`ignoreAsync function threw exception: ${error}`);
    });
  });
}
