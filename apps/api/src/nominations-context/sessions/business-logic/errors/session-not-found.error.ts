export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Session ${sessionId} non trouvée`);
    this.name = 'SessionNotFoundError';
  }
}
