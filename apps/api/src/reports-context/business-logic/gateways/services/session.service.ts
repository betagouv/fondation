import { SessionSnapshot } from 'src/nominations-context/business-logic/models/session';

export type SessionDto = SessionSnapshot;

export interface SessionService {
  session(sessionId: string): Promise<SessionDto | null>;
}
