export class TsvHeaderColumnMismatchError extends Error {
  constructor(
    columnIndex: number,
    expectedHeaderColumn: string,
    headerColumn?: string,
  ) {
    super(
      `Header mismatch at column ${columnIndex + 1}: Expected "${expectedHeaderColumn}", but got "${headerColumn}"`,
    );
    this.name = 'TsvHeaderColumnMismatchError';
  }
}
