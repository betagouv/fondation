import { SessionSnapshot } from 'src/nominations-context/sessions/business-logic/models/session';

export type SessionDto = SessionSnapshot;

export interface SessionService {
  session(sessionId: string): Promise<SessionDto | null>;
}
