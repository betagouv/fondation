export class FileLengthTooShortError extends Error {
  constructor(minimumLength: number, actualLength: number) {
    super(
      `File should have at least ${minimumLength} lines. Got ${actualLength}.`,
    );
    this.name = 'FileLengthTooShortError';
  }
}
