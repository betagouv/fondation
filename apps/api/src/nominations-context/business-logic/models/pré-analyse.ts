import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { DomainRegistry } from './domain-registry';
import { Règle, RègleSnapshot } from './règle';
import { TransparenceRulesMapper } from './transparence-rules.mapper';
import { z } from 'zod';

export type PréAnalyseSnapshot = {
  id: string;
  dossierDeNominationId: string;
  règles: RègleSnapshot[];
};

export const règleSchema = z.object({
  group: z.string(),
  name: z.string(),
  value: z.boolean(),
});
export const règlesSchema = règleSchema.array();

export class PréAnalyse {
  private constructor(
    private readonly _id: string,
    private readonly _dossierDeNominationId: string,
    private _règles: Règle[],
  ) {}

  mettreàJourRègles(tuplesRègles: Règle[]) {
    this._règles.forEach((règle) => {
      règle.àJourDesRèglesModifiées(tuplesRègles);
    });
  }

  get id(): string {
    return this._id;
  }

  snapshot(): PréAnalyseSnapshot {
    return {
      id: this._id,
      dossierDeNominationId: this._dossierDeNominationId,
      règles: this._règles.map((règle) => règle.snapshot()),
    };
  }

  static create(dossierDeNominationId: string, règles: Règle[]): PréAnalyse {
    const id = DomainRegistry.uuidGenerator().generate();
    return new PréAnalyse(id, dossierDeNominationId, règles);
  }

  static fromSnapshot(snapshot: PréAnalyseSnapshot): PréAnalyse {
    const règles = snapshot.règles.map((règleSnapshot) =>
      Règle.fromSnapshot(règleSnapshot),
    );

    return new PréAnalyse(snapshot.id, snapshot.dossierDeNominationId, règles);
  }

  static fromTransparenceRulesV1(
    dossierDeNominationId: string,
    rulesV1: GdsNewTransparenceImportedEventPayload['nominationFiles'][number]['content']['rules'],
  ) {
    const règle = new TransparenceRulesMapper().fromTransparenceRulesV1(
      rulesV1,
    );
    return this.create(dossierDeNominationId, règle);
  }
}
