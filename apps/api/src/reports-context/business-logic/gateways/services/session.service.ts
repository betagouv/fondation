import { SessionSnapshot } from 'src/nominations-context/business-logic/models/session';

export interface SessionService {
  transparence(sessionId: string): Promise<SessionSnapshot | null>;
}
