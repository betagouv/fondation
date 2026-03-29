declare namespace Express {
  interface Request {
    userId?: string;
    user?:
      | { type: 'machine'; token: string }
      | {
          type: 'human';
          id: string;
          role: string;
          sessionId: string;
          impersonation?: { id: string; impersonatorId: string };
        };
  }
}
