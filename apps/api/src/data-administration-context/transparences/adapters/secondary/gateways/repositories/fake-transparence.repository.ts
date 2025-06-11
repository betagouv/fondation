import { Magistrat } from 'shared-models';
import {
  Transparence as TransparenceTsv,
  TransparenceSnapshot as TransparenceTsvSnapshot,
} from 'src/data-administration-context/transparence-tsv/business-logic/models/transparence';
import {
  Transparence as TransparenceXlsx,
  TransparenceSnapshot as TransparenceXlsxSnapshot,
} from 'src/data-administration-context/transparence-xlsx/business-logic/models/transparence';
import { TransparenceRepository } from 'src/data-administration-context/transparences/business-logic/gateways/repositories/transparence.repository';

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

  transparence(name: string, formation: Magistrat.Formation) {
    return async () => {
      const transparence = Object.values(this.transparences).find(
        (transpa) => transpa.name === name && transpa.formation === formation,
      );

      // TODO Reprendre les types après le changement de méthode d'import
      return transparence
        ? (TransparenceTsv.fromSnapshot(
            transparence as TransparenceTsvSnapshot,
          ) as unknown as TransparenceXlsx)
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
