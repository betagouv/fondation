export interface SessionProvider {
  createSession(userId: string, expiresInDays: number): Promise<string>;
  invalidateSession(sessionId: string): Promise<void>;
}
