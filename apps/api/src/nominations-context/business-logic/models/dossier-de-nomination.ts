import { DomainRegistry } from './domain-registry';

//? Ajouter un type paramétré lorsqu'on gérera plusieurs types de saisines
export type DossierDeNominationContent = {
  [key: string]: unknown;
};

export type DossierDeNominationSnapshot = {
  id: string;
  sessionId: string;
  content: DossierDeNominationContent;
};

export class DossierDeNomination {
  private constructor(
    private readonly _id: string,
    private readonly _sessionId: string,
    private readonly _content: DossierDeNominationContent,
  ) {}

  get id(): string {
    return this._id;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get content(): DossierDeNominationContent {
    return { ...this._content };
  }

  snapshot(): DossierDeNominationSnapshot {
    return {
      id: this._id,
      sessionId: this._sessionId,
      content: this.content,
    };
  }

  static create(sessionId: string, content: DossierDeNominationContent) {
    const id = DomainRegistry.uuidGenerator().generate();
    return new DossierDeNomination(id, sessionId, content);
  }

  static fromSnapshot(snapshot: DossierDeNominationSnapshot) {
    return new DossierDeNomination(
      snapshot.id,
      snapshot.sessionId,
      snapshot.content,
    );
  }
}
