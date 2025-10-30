import { Magistrat, PrioriteEnum } from 'shared-models';
import { DomainRegistry } from './domain-registry';

import { DossierDeNomination } from 'src/nominations-context/dossier-de-nominations/business-logic/models/dossier-de-nomination';
import { z } from 'zod';

export enum StatutAffectation {
  BROUILLON = 'BROUILLON',
  PUBLIEE = 'PUBLIEE',
}

export type AffectationsDossiersDeNominations = {
  dossierDeNominationId: string;
  rapporteurIds: string[];
  priorite?: PrioriteEnum;
};

export type AffectationSnapshot = {
  id: string;
  sessionId: string;
  version: number;
  statut: StatutAffectation;
  datePublication?: Date;
  auteurPublication?: string;
  formation: Magistrat.Formation;
  affectationsDossiersDeNominations: AffectationsDossiersDeNominations[];
};

export const affectationsDossiersDeNominationsSchema = z.object({
  dossierDeNominationId: z.string(),
  rapporteurIds: z.array(z.string()),
  priorite: z.nativeEnum(PrioriteEnum).optional(),
});

export class Affectation {
  private constructor(
    private readonly _id: string,
    private _sessionId: string,
    private readonly _version: number,
    private _statut: StatutAffectation,
    private _datePublication: Date | undefined,
    private _auteurPublication: string | undefined,
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

  publier(auteurId: string) {
    if (this._statut === StatutAffectation.PUBLIEE) {
      throw new Error('Cette affectation est déjà publiée');
    }
    this._statut = StatutAffectation.PUBLIEE;
    this._datePublication = DomainRegistry.dateTimeProvider().now();
    this._auteurPublication = auteurId;
  }

  estPubliee(): boolean {
    return this._statut === StatutAffectation.PUBLIEE;
  }

  estBrouillon(): boolean {
    return this._statut === StatutAffectation.BROUILLON;
  }

  mettreAJourAffectations(affectations: AffectationsDossiersDeNominations[]) {
    if (this._statut === StatutAffectation.PUBLIEE) {
      throw new Error('Impossible de modifier une affectation publiée');
    }
    this._affectationsDossiersDeNominations = affectations;
  }

  get id(): string {
    return this._id;
  }

  get formation(): Magistrat.Formation {
    return this._formation;
  }

  get version(): number {
    return this._version;
  }

  get statut(): StatutAffectation {
    return this._statut;
  }

  snapshot(): AffectationSnapshot {
    return {
      id: this._id,
      sessionId: this._sessionId,
      version: this._version,
      statut: this._statut,
      datePublication: this._datePublication,
      auteurPublication: this._auteurPublication,
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
      snapshot.version,
      snapshot.statut,
      snapshot.datePublication,
      snapshot.auteurPublication,
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
    return new Affectation(
      id,
      sessionId,
      1,
      StatutAffectation.BROUILLON,
      undefined,
      undefined,
      formation,
      dossiersDeNomination,
    );
  }

  static creerNouvelleVersion(
    affectationPubliee: Affectation,
    numeroVersion: number,
  ): Affectation {
    if (!affectationPubliee.estPubliee()) {
      throw new Error('Seule une affectation publiée peut être versionnée');
    }

    const nouvelId = DomainRegistry.uuidGenerator().generate();

    return new Affectation(
      nouvelId,
      affectationPubliee._sessionId,
      numeroVersion,
      StatutAffectation.BROUILLON,
      undefined,
      undefined,
      affectationPubliee._formation,
      [...affectationPubliee._affectationsDossiersDeNominations],
    );
  }
}
