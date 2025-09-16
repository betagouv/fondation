import { TypeDeSaisine } from 'shared-models';
import {
  DossierDeNominationContent,
  DossierDeNominationSnapshot,
} from 'shared-models/models/session/dossier-de-nomination-content';
import { Exact } from 'type-fest/source/exact';
import { z } from 'zod';
import { DomainRegistry } from './domain-registry';
import { NouveauDossierDeNominationEvent } from './events/nouveau-dossier-de-nomination.event';

export const dossierDeNominationContentSchema = z.record(
  z.string(),
  z.unknown(),
);

export class DossierDeNomination<S extends TypeDeSaisine | unknown = unknown> {
  protected constructor(
    private readonly _id: string,
    private readonly _sessionId: string,
    private readonly _nominationFileImportedId: string,
    private _content: DossierDeNominationContent<S>,
  ) {}

  protected updateContent<
    Content extends Partial<DossierDeNominationContent<S>>,
  >(content: Exact<Partial<Content>, Partial<Content>>) {
    this.setContent({
      ...this._content,
      ...content,
    });
  }

  get id(): string {
    return this._id;
  }

  protected get content(): DossierDeNominationContent<S> {
    return this._content;
  }
  private setContent(content: DossierDeNominationContent<S>) {
    this._content = z.record(z.string(), z.any()).parse(content) as any;
  }

  snapshot(): DossierDeNominationSnapshot<S> {
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

  static fromSnapshot<S extends TypeDeSaisine | unknown = unknown>(
    snapshot: DossierDeNominationSnapshot<S>,
  ) {
    return new DossierDeNomination<S>(
      snapshot.id,
      snapshot.sessionId,
      snapshot.nominationFileImportedId,
      snapshot.content,
    );
  }
}
