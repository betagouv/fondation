export type TransactionableAsync<T = void, Trx = unknown> = (
  trx: Trx,
) => Promise<T>;

export interface TransactionPerformer {
  perform<T>(
    useCase: TransactionableAsync<T>,
    opts?: { retries: number },
  ): Promise<T>;
}
