import { Logger } from '@nestjs/common';

export class StorageResult<T> {
  private wasRollbacked = false;
  private readonly _failures: T[] = [];
  private readonly _successes: T[] = [];

  get failures(): readonly T[] {
    return this._failures;
  }

  get successes(): readonly T[] {
    return this._successes;
  }

  get success(): boolean {
    return this._failures.length === 0;
  }

  async rollback(): Promise<void> {
    if (this.wasRollbacked || !this.storageRollback) return;

    this.wasRollbacked = true;
    await this.storageRollback({ successes: this.successes, failures: this.failures }).catch((error) => {
      this.logger.error(`rollback threw`, error);
    });
  }

  constructor(
    private readonly logger = new Logger(StorageResult.name),
    private readonly storageRollback?: (state: {
      successes: readonly T[];
      failures: readonly T[];
    }) => Promise<unknown>,
  ) {}

  fail(...failures: T[]): this {
    this._failures.push(...failures);
    return this;
  }

  succeed(...successes: T[]): this {
    this._successes.push(...successes);
    return this;
  }
}
