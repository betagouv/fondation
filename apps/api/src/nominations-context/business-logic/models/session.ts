import { Magistrat } from 'shared-models';
import { Affectation } from './affectation';
import {
  DossierDeNomination,
  DossierDeNominationContent,
} from './dossier-de-nomination';
import { TypeDeSaisine } from './type-de-saisine';

export type SessionSnapshot = {
  id: string;
  name: string;
  formations: Magistrat.Formation[];
  typeDeSaisine: TypeDeSaisine;
};

export class Session {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _formations: Magistrat.Formation[],
    private readonly _typeDeSaisine: TypeDeSaisine,
  ) {}

  nouveauDossier(
    nominationFileImportedId: string,
    content: DossierDeNominationContent,
  ) {
    return DossierDeNomination.create(
      this._id,
      nominationFileImportedId,
      content,
    );
  }

  affecterRapporteurs(
    dossiers: {
      dossier: DossierDeNomination;
      rapporteurIds: string[];
    }[],
    formation: Magistrat.Formation,
  ): Affectation {
    return Affectation.nouvelle(
      this._id,
      formation,
      dossiers.map(({ dossier, rapporteurIds }) => ({
        dossierDeNominationId: dossier.id,
        rapporteurIds,
      })),
    );
  }

  get id(): string {
    return this._id;
  }

  snapshot(): SessionSnapshot {
    return {
      id: this._id,
      name: this._name,
      formations: this._formations,
      typeDeSaisine: this._typeDeSaisine,
    };
  }

  static nouvelle(
    id: string,
    typeDeSaisine: TypeDeSaisine,
    formations: Magistrat.Formation[],
  ) {
    const defaultName = id;
    return new Session(id, defaultName, formations, typeDeSaisine);
  }

  static fromSnapshot(snapshot: SessionSnapshot): Session {
    return new Session(
      snapshot.id,
      snapshot.name,
      snapshot.formations,
      snapshot.typeDeSaisine,
    );
  }
}
