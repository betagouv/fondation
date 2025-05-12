import { Magistrat } from 'shared-models';
import { Affectation } from './affectation';
import {
  DossierDeNomination,
  DossierDeNominationContent,
} from './dossier-de-nomination';
import { TypeDeSaisine } from './type-de-saisine';
import { DomainRegistry } from './domain-registry';

export type SessionSnapshot = {
  id: string;
  dataAdministrationImportId: string;
  name: string;
  formations: Magistrat.Formation[];
  typeDeSaisine: TypeDeSaisine;
  version: number;
};

export class Session {
  private constructor(
    private readonly _id: string,
    private readonly _dataAdministrationImportId: string,
    private readonly _name: string,
    private readonly _formations: Magistrat.Formation[],
    private readonly _typeDeSaisine: TypeDeSaisine,
    private readonly _version: number,
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

  get version(): number {
    return this._version;
  }

  snapshot(): SessionSnapshot {
    return {
      id: this._id,
      name: this._name,
      formations: this._formations,
      typeDeSaisine: this._typeDeSaisine,
      version: this._version,
      dataAdministrationImportId: this._dataAdministrationImportId,
    };
  }

  static nouvelle(
    dataAdministrationImportId: string,
    name: string,
    typeDeSaisine: TypeDeSaisine,
    formations: Magistrat.Formation[],
  ) {
    const id = DomainRegistry.uuidGenerator().generate();
    return new Session(
      id,
      dataAdministrationImportId,
      name,
      formations,
      typeDeSaisine,
      0,
    );
  }

  static fromSnapshot(snapshot: SessionSnapshot): Session {
    return new Session(
      snapshot.id,
      snapshot.dataAdministrationImportId,
      snapshot.name,
      snapshot.formations,
      snapshot.typeDeSaisine,
      snapshot.version,
    );
  }
}
