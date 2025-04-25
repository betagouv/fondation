import { TransparenceRepository } from 'src/nominations-context/business-logic/gateways/repositories/transparence.repository';
import {
  Transparence,
  TransparenceSnapshot,
} from 'src/nominations-context/business-logic/models/transparence';

export class FakeTransparenceRepository implements TransparenceRepository {
  transparences: Record<string, TransparenceSnapshot> = {};

  save(transparence: Transparence) {
    return async () => {
      this.transparences[transparence.id] = transparence.snapshot();
    };
  }
}
