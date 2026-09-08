import { FormationEnum } from 'src/modules/shared/formation.enum';
import * as time from 'src/utils/time';

export type ReceivedDesignations = { candidatures: number; perFormation: Record<FormationEnum, number> };

const FORMATION_LABELS: Record<FormationEnum, string> = { SIEGE: 'siège', PARQUET: 'parquet' };

// Every transparence ever received came with its candidatures, the longest gap observed between a
// publication and its import being a weekend. Past a week, an empty one is outside anything seen.
const EMPTY_TOLERANCE = time.WEEKS;

/**
 * A designated candidature must become a nomination file, so a formation that has designations and no
 * session lost data. The reverse is not true: a position where nobody is appointed is ordinary, only a
 * transparence without a single designation is the signature of a truncated file.
 */
export function incompleteTransparenceReason(
  transparence: {
    designations: ReceivedDesignations | undefined;
    formationsWithSession: ReadonlySet<FormationEnum>;
    publishedAt: Date;
  },
  now: Date,
): string | null {
  if (!transparence.designations) {
    const waited = now.getTime() - transparence.publishedAt.getTime();

    return waited < EMPTY_TOLERANCE ? null : 'aucune candidature reçue';
  }

  const { candidatures, perFormation } = transparence.designations;
  const expected = Object.values(FormationEnum).filter((formation) => perFormation[formation] > 0);

  if (expected.length === 0) {
    const received = `${candidatures} ${plural(candidatures, 'candidature')} et aucune proposition`;
    return transparence.formationsWithSession.size > 0 ? received : `${received}, aucune session créée`;
  }

  const missing = expected.filter((formation) => !transparence.formationsWithSession.has(formation));
  if (missing.length === 0) return null;

  return missing
    .map((formation) => {
      const designations = perFormation[formation];
      return `${designations} ${plural(designations, 'proposition')} au ${FORMATION_LABELS[formation]} sans session`;
    })
    .join(', ');
}

function plural(count: number, word: string): string {
  return count > 1 ? `${word}s` : word;
}
