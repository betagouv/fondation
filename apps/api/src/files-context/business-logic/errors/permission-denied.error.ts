export class PermissionDeniedError extends Error {
  constructor(fileId: string, userId: string) {
    const message = `Permission denied for file ID ${fileId} and user ID ${userId}`;
    super(message);
    this.name = 'PermissionDeniedError';
  }
}
