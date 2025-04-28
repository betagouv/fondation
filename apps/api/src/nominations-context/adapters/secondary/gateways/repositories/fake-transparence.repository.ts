import { TransparenceRepository } from 'src/nominations-context/business-logic/gateways/repositories/transparence.repository';
import {
  Session,
  SessionSnapshot,
} from 'src/nominations-context/business-logic/models/session';

export class FakeTransparenceRepository implements TransparenceRepository {
  transparences: Record<string, SessionSnapshot> = {};

  save(transparence: Session) {
    return async () => {
      this.transparences[transparence.id] = transparence.snapshot();
    };
  }
}
