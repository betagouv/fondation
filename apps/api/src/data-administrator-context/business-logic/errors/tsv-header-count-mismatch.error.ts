export class TsvHeaderCountMismatchError extends Error {
  constructor(expectedHeader: string[], headerColumns: string[]) {
    super(
      `Header column count mismatch: Expected ${expectedHeader.length} columns, but got ${headerColumns.length}.`,
    );
    this.name = 'TsvHeaderCountMismatchError';
  }
}
