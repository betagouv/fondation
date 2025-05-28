export type TransactionableAsync<T = void> = () => Promise<T>;

export interface TransactionPerformer {
  perform<T>(
    useCase: TransactionableAsync<T>,
    opts?: { retries: number },
  ): Promise<T>;
}
