import { unaccent } from 'src/utils/unaccent';

// LOLFI codes of the positions the CSM hears before deciding, whatever the jurisdiction:
// the deputies of the national prosecutor's offices have their own function code (PRA F, PRATA, PRACOADJ)
const AUDITIONED_FUNCTIONS = new Set([
  '1PC',
  'IG-CIGJ',
  'IGJ',
  'IGSJ',
  'PG',
  'PR',
  'PR F',
  'PRA F',
  'PRACO',
  'PRACOADJ',
  'PRAT',
  'PRATA',
]);
// beware the padding of LOLFI jurisdiction codes: two spaces in "CC  PARIS" and "TJ  PARIS"
const AUDITIONED_POSITIONS = [
  { functionId: '1AG', jurisdictionId: 'CC  PARIS' },
  { functionId: '1VP', jurisdictionId: 'TJ  PARIS' },
  { functionId: 'AG', jurisdictionId: 'CC  PARIS' },
  { functionId: 'AG SE', jurisdictionId: 'CC  PARIS' },
  { functionId: 'AGR', jurisdictionId: 'CC  PARIS' },
  { functionId: 'PRA', jurisdictionId: 'TJ  PARIS' },
];
const AUDITIONED_JURISDICTION_TYPES = [{ functionId: '1AG', jurisdictionType: 'CA' }];
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
  detectedJurisdictionType: string | null;
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

  const matchesAuditionedJurisdictionType = AUDITIONED_JURISDICTION_TYPES.some(
    (position) =>
      position.functionId === file.detectedTargetedFunctionId &&
      position.jurisdictionType === file.detectedJurisdictionType,
  );
  if (matchesAuditionedJurisdictionType) return true;

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
