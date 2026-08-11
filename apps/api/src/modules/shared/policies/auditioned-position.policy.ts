import { unaccent } from 'src/utils/unaccent';

const AUDITIONED_FUNCTIONS = new Set(['PG', 'PR F', 'PRAT', '1PC']);
const AUDITIONED_POSITIONS = [
  { functionId: '1AG', jurisdictionId: 'CC  PARIS' },
  { functionId: 'AG', jurisdictionId: 'CC  PARIS' },
  { functionId: 'PR', jurisdictionId: 'TJ  PARIS' },
];
const AUDITIONED_LEGACY_LABELS = [
  'procureur general',
  'premier avocat general pres la cour de cassation',
  'avocat general pres la cour de cassation',
  'procureur pres la cour de cassation',
  'procureur national anti-terroriste',
  'procureur national financier',
  'premier president de chambre',
  'avocat general cc  paris',
  'premier avocat general cc  paris',
];

type AuditionedPosition = {
  detectedJurisdictionId: string | null;
  detectedTargetedFunctionId: string | null;
  targetedPosition: string | null;
};

export function isAuditionExpected(file: AuditionedPosition): boolean {
  if (file.detectedTargetedFunctionId && AUDITIONED_FUNCTIONS.has(file.detectedTargetedFunctionId)) {
    return true;
  }

  const matchesAuditionedPosition = AUDITIONED_POSITIONS.some(
    (position) =>
      position.functionId === file.detectedTargetedFunctionId &&
      position.jurisdictionId === file.detectedJurisdictionId,
  );
  if (matchesAuditionedPosition) return true;

  const label = unaccent(file.targetedPosition ?? '').toLowerCase();
  return !!label && AUDITIONED_LEGACY_LABELS.some((legacyLabel) => label.startsWith(legacyLabel));
}

const AUDITIONED_REPORTERS = 2;

/**
 * Auditioned positions expect two reporters, the other ones carry no specific expectation.
 * @see https://www.notion.so/2-Proposer-automatiquement-deux-rapporteurs-sur-certains-postes-26aa2ff25f1581848cc0eef5a4d77252
 */
export function expectedReportersCount(file: AuditionedPosition): number | null {
  return isAuditionExpected(file) ? AUDITIONED_REPORTERS : null;
}
