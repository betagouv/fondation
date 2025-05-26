import { TransparenceCsvRepository } from 'src/data-administration-context/transparence-tsv/business-logic/gateways/repositories/transparence-csv.repository';
import {
  TransparenceCsv,
  TransparenceCsvSnapshot,
} from 'src/data-administration-context/transparence-tsv/business-logic/models/transparence-csv';

export class FakeTransparenceCsvRepository
  implements TransparenceCsvRepository
{
  fichiers: Record<string, TransparenceCsvSnapshot> = {};

  enregistrerCsv(transparenceCsv: TransparenceCsv) {
    return async () => {
      this.fichiers[transparenceCsv.id] = transparenceCsv.snapshot();
    };
  }

  getFichiers() {
    return Object.values(this.fichiers);
  }
}
