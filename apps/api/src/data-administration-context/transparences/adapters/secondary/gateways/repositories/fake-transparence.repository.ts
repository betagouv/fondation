import { Magistrat } from 'shared-models';
import {
  Transparence as TransparenceXlsx,
  TransparenceSnapshot as TransparenceXlsxSnapshot,
} from 'src/data-administration-context/transparence-xlsx/business-logic/models/transparence';
import { TransparenceRepository } from 'src/data-administration-context/transparences/business-logic/gateways/repositories/transparence.repository';

export class FakeTransparenceRepository implements TransparenceRepository {
  private transparences: Record<string, TransparenceXlsxSnapshot> = {};

  save(transparence: TransparenceXlsx) {
    return async () => {
      this.transparences[transparence.id] = transparence.snapshot();
    };
  }

  transparence(name: string, formation: Magistrat.Formation) {
    return async () => {
      const transparence = Object.values(this.transparences).find(
        (transpa) => transpa.name === name && transpa.formation === formation,
      );

      return transparence ? TransparenceXlsx.fromSnapshot(transparence) : null;
    };
  }

  addTransparence(transparence: TransparenceXlsxSnapshot) {
    this.transparences[transparence.id] = transparence;
  }

  getTransparences() {
    return Object.values(this.transparences);
  }
}
