import { Magistrat } from 'shared-models';
import { TransparenceRepository } from 'src/data-administration-context/transparence-xlsx/business-logic/gateways/repositories/transparence.repository';
import {
  Transparence,
  TransparenceSnapshot,
} from 'src/data-administration-context/transparence-xlsx/business-logic/models/transparence';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakeTransparenceRepository implements TransparenceRepository {
  private transparences: Record<string, TransparenceSnapshot> = {};

  save(transparence: Transparence) {
    return async () => {
      this.transparences[transparence.id] = transparence.snapshot();
    };
  }

  transparence(
    name: string,
    formation: Magistrat.Formation,
  ): TransactionableAsync<Transparence | null> {
    return async () => {
      const transparence = Object.values(this.transparences).find(
        (transpa) => transpa.name === name && transpa.formation === formation,
      );
      return transparence ? Transparence.fromSnapshot(transparence) : null;
    };
  }

  addTransparence(id: string, transparence: TransparenceSnapshot) {
    this.transparences[id] = transparence;
  }

  getTransparences() {
    return Object.values(this.transparences);
  }
}
