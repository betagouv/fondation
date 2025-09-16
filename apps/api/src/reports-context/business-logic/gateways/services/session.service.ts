import { TypeDeSaisine } from 'shared-models';
import { SessionSnapshot } from 'shared-models/models/session/session-content';

export type SessionDto<S extends TypeDeSaisine | unknown = unknown> =
  SessionSnapshot<S>;

export type TransparenceDto = SessionDto<TypeDeSaisine.TRANSPARENCE_GDS>;

export interface SessionService<S extends TypeDeSaisine | unknown = unknown> {
  session(sessionId: string): Promise<SessionDto<S> | null>;
}

export type TransparenceService =
  SessionService<TypeDeSaisine.TRANSPARENCE_GDS>;
