import type { TypeDeSaisineEnum } from '@/shared/enums/type-de-saisine.enum';

/** the word LODAM puts in front of a session name, matched and rebuilt as data, never displayed on its own */
const TRANSPARENCE_NAME_PREFIX = 'Transparence';

export function normalizeSessionName(session: { name: string; typeDeSaisine: TypeDeSaisineEnum }): string {
  if (session.typeDeSaisine === 'TRANSPARENCE_GDS') {
    const withoutSaisine = session.name.replace(
      new RegExp(`^${TRANSPARENCE_NAME_PREFIX.toLowerCase()}`, 'i'),
      '',
    );

    return `${TRANSPARENCE_NAME_PREFIX} ${withoutSaisine}`;
  }

  return session.name;
}
