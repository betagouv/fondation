declare namespace Express {
  interface Request {
    userId?: string;
    user?:
      | { type: 'human'; id: string; role: string }
      | { type: 'machine'; token: string };
  }
}
