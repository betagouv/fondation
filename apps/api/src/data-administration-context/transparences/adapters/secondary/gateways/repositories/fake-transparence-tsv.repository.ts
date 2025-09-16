import { EditTransparencyDto, Magistrat } from 'shared-models';
import {
  Transparence as TransparenceTsv,
  TransparenceSnapshot as TransparenceTsvSnapshot,
} from 'src/data-administration-context/transparence-tsv/business-logic/models/transparence';
import {
  Transparence as TransparenceXlsx,
  TransparenceSnapshot as TransparenceXlsxSnapshot,
} from 'src/data-administration-context/transparence-xlsx/business-logic/models/transparence';
import { TransparenceRepository } from 'src/data-administration-context/transparences/business-logic/gateways/repositories/transparence.repository';

export class FakeTransparenceTsvRepository implements TransparenceRepository {
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

      return transparence
        ? (TransparenceTsv.fromSnapshot(
            transparence as TransparenceTsvSnapshot,
          ) as unknown as TransparenceXlsx)
        : null;
    };
  }

  findById(sessionId: string) {
    return async () => {
      const transparence = this.transparences[sessionId];
      return transparence
        ? (TransparenceTsv.fromSnapshot(
            transparence as TransparenceTsvSnapshot,
          ) as unknown as TransparenceXlsx)
        : null;
    };
  }

  findBySessionIds(sessionIds: string[]) {
    return async () => {
      const transparences = Object.values(this.transparences).filter(
        (transparence) => sessionIds.includes(transparence.id),
      );
      return transparences.map(
        (transparence) =>
          TransparenceTsv.fromSnapshot(
            transparence as TransparenceTsvSnapshot,
          ) as unknown as TransparenceXlsx,
      );
    };
  }

  addTransparence(
    transparence: TransparenceTsvSnapshot | TransparenceXlsxSnapshot,
  ) {
    this.transparences[transparence.id] = transparence;
  }

  getTransparences() {
    return Object.values(this.transparences);
  }

  updateMetadata(sessionId: string, transparence: EditTransparencyDto) {
    console.log('SessionId', sessionId, 'Transparence', transparence);
    return async () => {};
  }
}
