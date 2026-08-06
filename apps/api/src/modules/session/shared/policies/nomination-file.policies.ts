import { NominationFileDocsSnapshot } from '../types/nomination-file';
import { NominationFileOutcome, NominationFileOutcomeEnum } from '../types/nomination-file-outcome';
import { isDefined } from 'src/utils/is-defined';
import { unaccent } from 'src/utils/unaccent';

const FINAL_OUTCOMES = new Set<NominationFileOutcomeEnum>(NominationFileOutcome.finalOutcomes());
export function canUpdateNominationFile(
  file: NominationFileDocsSnapshot,
  session: { archivedAt: Date | null | undefined },
): boolean {
  const isOutcomeIgnored = file.outcome === null || !FINAL_OUTCOMES.has(file.outcome);

  const isLinkedToOfficialReportWithFinalOutcome = file.docs.some(
    (doc) => isDefined(doc.officialReport) && FINAL_OUTCOMES.has(doc.officialReport.outcome),
  );

  return !session.archivedAt && (isOutcomeIgnored || !isLinkedToOfficialReportWithFinalOutcome);
}

const NON_FINAL_OUTCOMES = new Set<NominationFileOutcomeEnum>(NominationFileOutcome.nonFinalOutcomes());
export function canScheduleAudition(
  file: { outcome: NominationFileOutcomeEnum | null },
  session: { archivedAt: Date | null | undefined },
): boolean {
  return !session.archivedAt && (file.outcome === null || NON_FINAL_OUTCOMES.has(file.outcome));
}

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

/**
 * Positions requiring two reporters are the positions whose candidates are auditioned.
 * @see https://www.notion.so/2-Proposer-automatiquement-deux-rapporteurs-sur-certains-postes-26aa2ff25f1581848cc0eef5a4d77252
 */
export function isAuditionExpected(file: {
  detectedJurisdictionId: string | null;
  detectedTargetedFunctionId: string | null;
  targetedPosition: string | null;
}): boolean {
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
