import { Magistrat } from 'shared-models';
import { DomainRegistry } from './domain-registry';

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

export class Affectation {
  private constructor(
    private readonly _id: string,
    private _sessionId: string,
    private _formation: Magistrat.Formation,
    private _affectationsDossiersDeNominations: AffectationsDossiersDeNominations[],
  ) {}

  snapshot(): AffectationSnapshot {
    return {
      id: this._id,
      sessionId: this._sessionId,
      formation: this._formation,
      affectationsDossiersDeNominations:
        this._affectationsDossiersDeNominations,
    };
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
