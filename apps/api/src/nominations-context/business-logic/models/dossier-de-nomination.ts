import { DomainRegistry } from './domain-registry';
import { NouveauDossierDeNominationEvent } from './events/nouveau-dossier-de-nomination.event';

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

  snapshot(): DossierDeNominationSnapshot {
    return {
      id: this._id,
      sessionId: this._sessionId,
      content: this._content,
    };
  }

  static create(sessionId: string, content: DossierDeNominationContent) {
    const uuidGenerator = DomainRegistry.uuidGenerator();
    const id = uuidGenerator.generate();
    const dossier = new DossierDeNomination(id, sessionId, content);
    const event = NouveauDossierDeNominationEvent.create({
      dossierDeNominationId: id,
      sessionId,
      content,
    });

    return [dossier, event] as const;
  }

  static fromSnapshot(snapshot: DossierDeNominationSnapshot) {
    return new DossierDeNomination(
      snapshot.id,
      snapshot.sessionId,
      snapshot.content,
    );
  }
}
