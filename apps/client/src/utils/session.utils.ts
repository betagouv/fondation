import { TypeDeSaisineEnumLabels, type TypeDeSaisineEnum } from '@/types/enums.types';

export function normalizeSessionName(session: { name: string; typeDeSaisine: TypeDeSaisineEnum }): string {
  if (session.typeDeSaisine === 'TRANSPARENCE_GDS') {
    const withoutSaisine = session.name.replace(
      new RegExp(`^${TypeDeSaisineEnumLabels.TRANSPARENCE_GDS.toLowerCase()}`, 'i'),
      '',
    );

    return `${TypeDeSaisineEnumLabels.TRANSPARENCE_GDS} ${withoutSaisine}`;
  }

  return session.name;
}
