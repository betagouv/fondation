import { DateOnlyJson, Magistrat, TypeDeSaisine } from 'shared-models';
import { Affectation } from './affectation';
import { DomainRegistry } from './domain-registry';
import {
  DossierDeNomination,
  DossierDeNominationContent,
} from './dossier-de-nomination';

export type SessionContent<S extends TypeDeSaisine | unknown = unknown> =
  S extends TypeDeSaisine.TRANSPARENCE_GDS
    ? {
        dateTransparence: DateOnlyJson;
        dateClôtureDélaiObservation: DateOnlyJson;
      }
    : object;

export type SessionSnapshot<S extends TypeDeSaisine | unknown = unknown> = {
  id: string;
  sessionImportéeId: string;
  name: string;
  formation: Magistrat.Formation;
  typeDeSaisine: TypeDeSaisine;
  version: number;
  content: SessionContent<S>;
};

export class Session<S extends TypeDeSaisine | unknown = unknown> {
  private constructor(
    private readonly _id: string,
    private readonly _sessionImportéeId: string,
    private readonly _name: string,
    private readonly _formation: Magistrat.Formation,
    private readonly _typeDeSaisine: TypeDeSaisine,
    private readonly _version: number,
    private readonly _content: SessionContent<S>,
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

  get formation() {
    return this._formation;
  }

  snapshot(): SessionSnapshot<S> {
    return {
      id: this._id,
      name: this._name,
      formation: this._formation,
      typeDeSaisine: this._typeDeSaisine,
      version: this._version,
      sessionImportéeId: this._sessionImportéeId,
      content: this._content,
    };
  }

  static nouvelleTransparence(
    sessionImportéeId: string,
    name: string,
    typeDeSaisine: TypeDeSaisine,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
    dateClôtureDélaiObservation: DateOnlyJson,
  ) {
    const id = DomainRegistry.uuidGenerator().generate();
    return new Session<TypeDeSaisine.TRANSPARENCE_GDS>(
      id,
      sessionImportéeId,
      name,
      formation,
      typeDeSaisine,
      0,
      {
        dateTransparence,
        dateClôtureDélaiObservation,
      },
    );
  }

  static fromSnapshot(snapshot: SessionSnapshot): Session {
    return new Session(
      snapshot.id,
      snapshot.sessionImportéeId,
      snapshot.name,
      snapshot.formation,
      snapshot.typeDeSaisine,
      snapshot.version,
      snapshot.content,
    );
  }
}
