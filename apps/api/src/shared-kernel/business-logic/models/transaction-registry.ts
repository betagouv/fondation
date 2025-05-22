export abstract class TransactionRegistry {
  private static transactions: Record<string, unknown | null> = {};

  static setTransaction(id: string, transaction: unknown | null) {
    TransactionRegistry.transactions = {
      ...TransactionRegistry.transactions,
      [id]: transaction,
    };
  }

  static removeTransaction(id: string) {
    delete TransactionRegistry.transactions[id];
  }

  static transaction(id: string): unknown {
    if (!TransactionRegistry.transactions) {
      throw new Error('Transaction is not set');
    }
    return TransactionRegistry.transactions[id];
  }
}
