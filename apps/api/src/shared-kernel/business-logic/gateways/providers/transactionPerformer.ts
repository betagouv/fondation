export type TransactionableAsync<T = void> = (trx: unknown) => Promise<T>;

export interface TransactionPerformer {
  perform<T>(useCase: TransactionableAsync<T>): Promise<T>;
}
