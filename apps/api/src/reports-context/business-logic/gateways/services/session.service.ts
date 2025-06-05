import { DateOnlyJson, Magistrat } from 'shared-models';
import { SessionSnapshot } from 'src/nominations-context/sessions/business-logic/models/session';

export type SessionDto = SessionSnapshot;

export interface SessionService {
  session(sessionId: string): Promise<SessionDto | null>;
  sessionParCriteres(
    nomTransparence: string,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
  ): Promise<SessionDto | null>;
}
