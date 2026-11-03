import type { Publishable } from './publication';

type Affectation = { nominationFileId: string; reporterId: string };

// the members read reporters per file: the order or the version number of a draft changes nothing for them
export class PublishableAffectations implements Publishable<PublishableAffectations> {
  private constructor(private readonly keys: ReadonlySet<string>) {}

  static from(affectations: readonly Affectation[]): PublishableAffectations {
    return new PublishableAffectations(
      new Set(affectations.map(({ nominationFileId, reporterId }) => `${nominationFileId}/${reporterId}`)),
    );
  }

  equals(other: PublishableAffectations): boolean {
    return this.keys.size === other.keys.size && [...this.keys].every((key) => other.keys.has(key));
  }

  isEmpty(): boolean {
    return this.keys.size === 0;
  }
}
