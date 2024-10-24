export class CreateReportValidationError extends Error {
  constructor(originalError: Error) {
    super('Create report validation error');
    this.name = 'CreateReportValidationError';
    this.stack = originalError.stack;
  }
}
