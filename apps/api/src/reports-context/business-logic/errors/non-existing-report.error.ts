export class NonExistingReportError extends Error {
  constructor() {
    super('Report does not exist.');
    this.name = 'NonExistingReportError';
  }
}
