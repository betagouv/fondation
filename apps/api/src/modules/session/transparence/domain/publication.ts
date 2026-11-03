import type { PublicationStatus } from '../../../shared/publication-status.enum';

export interface Publishable<T> {
  equals(other: T): boolean;
  isEmpty(): boolean;
}

// the members only miss something once what the secretariat works on differs from what they read
export function publicationStatusOf<T extends Publishable<T>>(versions: {
  current: T;
  published: T | null;
}): PublicationStatus {
  if (!versions.published) return versions.current.isEmpty() ? 'NOTHING_TO_PUBLISH' : 'NEVER_PUBLISHED';

  return versions.published.equals(versions.current) ? 'PUBLISHED' : 'UNPUBLISHED_CHANGES';
}
