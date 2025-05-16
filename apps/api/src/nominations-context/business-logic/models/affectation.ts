import { Magistrat } from 'shared-models';
import { DomainRegistry } from './domain-registry';
import { DossierDeNomination } from './dossier-de-nomination';
import { z } from 'zod';

export type AffectationsDossiersDeNominations = {
  dossierDeNominationId: string;
  rapporteurIds: string[];
};

export type AffectationSnapshot = {
  id: string;
  sessionId: string;
  formation: Magistrat.Formation;
  affectationsDossiersDeNominations: AffectationsDossiersDeNominations[];
};

export const affectationsDossiersDeNominationsSchema = z.object({
  dossierDeNominationId: z.string(),
  rapporteurIds: z.array(z.string()),
});

export class Affectation {
  private constructor(
    private readonly _id: string,
    private _sessionId: string,
    private _formation: Magistrat.Formation,
    private _affectationsDossiersDeNominations: AffectationsDossiersDeNominations[],
  ) {}

  ajouterDossier(
    dossier: DossierDeNomination<unknown>,
    rapporteurIds: string[],
  ) {
    this._affectationsDossiersDeNominations.push({
      dossierDeNominationId: dossier.id,
      rapporteurIds,
    });
  }

  get id(): string {
    return this._id;
  }

  get formation(): Magistrat.Formation {
    return this._formation;
  }

  snapshot(): AffectationSnapshot {
    return {
      id: this._id,
      sessionId: this._sessionId,
      formation: this._formation,
      affectationsDossiersDeNominations: [
        ...this._affectationsDossiersDeNominations,
      ],
    };
  }

  static fromSnapshot(snapshot: AffectationSnapshot): Affectation {
    return new Affectation(
      snapshot.id,
      snapshot.sessionId,
      snapshot.formation,
      [...snapshot.affectationsDossiersDeNominations],
    );
  }

  static nouvelle(
    sessionId: string,
    formation: Magistrat.Formation,
    dossiersDeNomination: AffectationsDossiersDeNominations[],
  ): Affectation {
    const id = DomainRegistry.uuidGenerator().generate();
    return new Affectation(id, sessionId, formation, dossiersDeNomination);
  }
}
