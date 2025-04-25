import { Magistrat } from 'shared-models';

export type AffectationsDossiersDeNominations = {
  dossierDeNominationId: string;
  rapporteurIds: string[];
};

export type AffectationSnapshot = {
  transparenceId: string;
  formation: Magistrat.Formation;
  affectationsDossiersDeNominations: AffectationsDossiersDeNominations[];
};

export class Affectation {
  constructor(
    private _transparenceId: string,
    private _formation: Magistrat.Formation,
    private _affectationsDossiersDeNominations: AffectationsDossiersDeNominations[],
  ) {}

  get transparenceId(): string {
    return this._transparenceId;
  }

  get formation(): Magistrat.Formation {
    return this._formation;
  }

  get affectationsDossiersDeNominations(): AffectationsDossiersDeNominations[] {
    return this._affectationsDossiersDeNominations;
  }

  createSnapshot(): AffectationSnapshot {
    return {
      transparenceId: this._transparenceId,
      formation: this._formation,
      affectationsDossiersDeNominations:
        this._affectationsDossiersDeNominations,
    };
  }
}
