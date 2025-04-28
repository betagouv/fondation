import { PréAnalyseRepository } from 'src/nominations-context/business-logic/gateways/repositories/pré-analyse.repository';
import {
  PréAnalyse,
  PréAnalyseSnapshot,
} from 'src/nominations-context/business-logic/models/pré-analyse';

export class FakePréAnalyseRepository implements PréAnalyseRepository {
  préAnalyses: Record<string, PréAnalyseSnapshot> = {};

  save(préAnalyse: PréAnalyse) {
    return async () => {
      this.préAnalyses[préAnalyse.id] = préAnalyse.snapshot();
    };
  }

  findByDossierId(dossierId: string): PréAnalyseSnapshot | undefined {
    return Object.values(this.préAnalyses).find(
      (préAnalyse) => préAnalyse.dossierDeNominationId === dossierId,
    );
  }

  getPréAnalyses(): PréAnalyseSnapshot[] {
    return Object.values(this.préAnalyses);
  }
}
