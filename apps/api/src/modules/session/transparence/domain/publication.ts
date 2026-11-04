import type { PublicationStatus } from '../../../shared/publication-status.enum';

export interface Publishable<T> {
  equals(other: T): boolean;
  waitsForAFirstPublication(): boolean;
}

// the members only miss something once what the secretariat works on differs from what they read
export function publicationStatusOf<T extends Publishable<T>>(versions: {
  current: T;
  published: T | null;
}): PublicationStatus {
  if (!versions.published)
    return versions.current.waitsForAFirstPublication() ? 'NEVER_PUBLISHED' : 'NOTHING_TO_PUBLISH';

  return versions.published.equals(versions.current) ? 'PUBLISHED' : 'UNPUBLISHED_CHANGES';
}
