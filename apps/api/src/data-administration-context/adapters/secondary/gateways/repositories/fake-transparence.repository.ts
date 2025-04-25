import { Transparency } from 'shared-models';
import { TransparenceRepository } from 'src/data-administration-context/business-logic/gateways/repositories/transparence.repository';
import {
  Transparence,
  TransparenceSnapshot,
} from 'src/data-administration-context/business-logic/models/transparence';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakeTransparenceRepository implements TransparenceRepository {
  private transparences: Record<string, TransparenceSnapshot> = {};

  transparence(name: Transparency): TransactionableAsync<Transparence | null> {
    return async () => {
      const transparence = this.transparences[name];
      return transparence ? Transparence.fromSnapshot(transparence) : null;
    };
  }

  save(transparence: Transparence) {
    return async () => {
      this.transparences[transparence.name] = transparence.snapshot();
    };
  }

  addTransparence(name: Transparency, transparence: TransparenceSnapshot) {
    this.transparences[name] = transparence;
  }

  getTransparences() {
    return Object.values(this.transparences);
  }
}
