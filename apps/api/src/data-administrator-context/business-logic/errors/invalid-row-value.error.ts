export class InvalidRowValueError extends Error {
  constructor(rule: string, rowIndex: number) {
    super(`Invalid value for rule ${rule} in row ${rowIndex + 1}`);
    this.name = 'InvalidRowValueError';
  }
}
