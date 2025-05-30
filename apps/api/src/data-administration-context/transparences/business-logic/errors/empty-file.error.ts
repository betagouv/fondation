export class EmptyFileError extends Error {
  constructor() {
    super('Empty file');
    this.name = 'EmptyFileError';
  }
}
