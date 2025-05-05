import { PréAnalyseRepository } from 'src/nominations-context/business-logic/gateways/repositories/pré-analyse.repository';
import {
  PréAnalyse,
  PréAnalyseSnapshot,
} from 'src/nominations-context/business-logic/models/pré-analyse';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakePréAnalyseRepository implements PréAnalyseRepository {
  private préAnalyses: Record<string, PréAnalyseSnapshot> = {};

  save(préAnalyse: PréAnalyse) {
    return async () => {
      this.préAnalyses[préAnalyse.id] = préAnalyse.snapshot();
    };
  }

  findByDossierId(dossierId: string): TransactionableAsync<PréAnalyse | null> {
    return async () => {
      const préAnalyse = Object.values(this.préAnalyses).find(
        (préAnalyse) => préAnalyse.dossierDeNominationId === dossierId,
      );

      return préAnalyse ? PréAnalyse.fromSnapshot(préAnalyse) : null;
    };
  }

  getPréAnalyses(): PréAnalyseSnapshot[] {
    return Object.values(this.préAnalyses);
  }

  addPréAnalyses(...préAnalyses: PréAnalyseSnapshot[]) {
    préAnalyses.forEach((préAnalyse) => {
      this.préAnalyses[préAnalyse.id] = préAnalyse;
    });
  }
}
