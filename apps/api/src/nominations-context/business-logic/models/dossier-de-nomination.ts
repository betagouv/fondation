import { DateOnlyJson, Magistrat } from 'shared-models';
import { z } from 'zod';
import { DomainRegistry } from './domain-registry';
import { NouveauDossierDeNominationEvent } from './events/nouveau-dossier-de-nomination.event';
import { TypeDeSaisine } from 'shared-models';

type ContenuInconnu = Record<string, unknown>;

export interface ContenuDossierDeNominationTransparence extends ContenuInconnu {
  folderNumber: number | null;
  name: string;
  formation: Magistrat.Formation;
  dueDate: DateOnlyJson | null;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  rank: string;
  birthDate: DateOnlyJson;
  biography: string | null;
  observers: string[] | null;
}

export class DossierDeNominationTransparence {
  constructor(private readonly _dossierDeNomination: DossierDeNomination) {}

  updateFolderNumber(folderNumber: number) {
    this._dossierDeNomination.updateContent({
      folderNumber,
    });
  }

  updateObservers(observers: string[]) {
    this._dossierDeNomination.updateContent({
      observers,
    });
  }
}

export type DossierDeNominationContent<
  S extends TypeDeSaisine | unknown = unknown,
> = S extends TypeDeSaisine.TRANSPARENCE_GDS
  ? ContenuDossierDeNominationTransparence
  : ContenuInconnu;

export type DossierDeNominationSnapshot<
  S extends TypeDeSaisine | unknown = unknown,
> = {
  id: string;
  sessionId: string;
  nominationFileImportedId: string;
  content: DossierDeNominationContent<S>;
};

export const dossierDeNominationContentSchema = z.record(
  z.string(),
  z.unknown(),
);

export class DossierDeNomination<S extends TypeDeSaisine | unknown = unknown> {
  private constructor(
    private readonly _id: string,
    private readonly _sessionId: string,
    private readonly _nominationFileImportedId: string,
    private _content: DossierDeNominationContent<S>,
  ) {}

  updateContent(content: Partial<DossierDeNominationContent<S>>) {
    this.setContent({
      ...this._content,
      ...content,
    });
  }

  get id(): string {
    return this._id;
  }

  get content(): DossierDeNominationContent<S> {
    return this._content;
  }
  setContent(content: DossierDeNominationContent<S>) {
    this._content = z.record(z.string(), z.any()).parse(content) as any;
  }

  snapshot(): DossierDeNominationSnapshot {
    return {
      id: this._id,
      sessionId: this._sessionId,
      nominationFileImportedId: this._nominationFileImportedId,
      content: this._content,
    };
  }

  static create(
    sessionId: string,
    nominationFileImportedId: string,
    content: DossierDeNominationContent,
  ) {
    const uuidGenerator = DomainRegistry.uuidGenerator();
    const id = uuidGenerator.generate();
    const dossier = new DossierDeNomination(
      id,
      sessionId,
      nominationFileImportedId,
      content,
    );
    const event = NouveauDossierDeNominationEvent.create({
      dossierDeNominationId: id,
      sessionId,
      nominationFileImportedId,
      content,
    });

    return [dossier, event] as const;
  }

  static fromSnapshot(snapshot: DossierDeNominationSnapshot) {
    return new DossierDeNomination(
      snapshot.id,
      snapshot.sessionId,
      snapshot.nominationFileImportedId,
      snapshot.content,
    );
  }
}
