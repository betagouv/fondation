import { Magistrat } from 'shared-models';
import { TransparenceRepository } from 'src/data-administration-context/transparences/business-logic/gateways/repositories/transparence.repository';
import {
  Transparence as TransparenceXlsx,
  TransparenceSnapshot as TransparenceXlsxSnapshot,
} from 'src/data-administration-context/transparence-xlsx/business-logic/models/transparence';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import {
  TransparenceSnapshot as TransparenceTsvSnapshot,
  Transparence as TransparenceTsv,
} from 'src/data-administration-context/transparence-tsv/business-logic/models/transparence';

export class FakeTransparenceRepository implements TransparenceRepository {
  private transparences: Record<
    string,
    TransparenceTsvSnapshot | TransparenceXlsxSnapshot
  > = {};

  save(transparence: TransparenceTsv | TransparenceXlsx) {
    return async () => {
      this.transparences[transparence.id] = transparence.snapshot();
    };
  }

  transparence(
    name: string,
    formation: Magistrat.Formation,
  ): TransactionableAsync<TransparenceTsv | null> {
    return async () => {
      const transparence = Object.values(this.transparences).find(
        (transpa) => transpa.name === name && transpa.formation === formation,
      );
      return transparence
        ? TransparenceTsv.fromSnapshot(transparence as TransparenceTsvSnapshot)
        : null;
    };
  }

  addTransparence(
    id: string,
    transparence: TransparenceTsvSnapshot | TransparenceXlsxSnapshot,
  ) {
    this.transparences[id] = transparence;
  }

  getTransparences() {
    return Object.values(this.transparences);
  }
}
