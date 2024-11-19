export type TransactionableAsync<T = void, Trx = unknown> = (
  trx: Trx,
) => Promise<T>;

export interface TransactionPerformer {
  perform<T>(
    useCase: TransactionableAsync<T>,
    cleanup?: () => Promise<void>,
  ): Promise<T>;
}
