export class InvalidRowValueError extends Error {
  constructor(columnName: string, rowValue: string, rowIndex: number) {
    super(
      `Invalid value for ${columnName}: ${rowValue} in row ${rowIndex + 1}`,
    );
    this.name = 'InvalidRowValueError';
  }
}
