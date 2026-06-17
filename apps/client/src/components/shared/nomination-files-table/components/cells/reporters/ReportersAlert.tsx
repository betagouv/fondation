import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';

import { useIsSgNavigation } from '@/hooks/roles.hook';
import { unaccent } from '@/utils/string.utils';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

/** @see https://www.notion.so/2-Proposer-automatiquement-deux-rapporteurs-sur-certains-postes-26aa2ff25f1581848cc0eef5a4d77252 */
function requires2Reporters(dossier: SessionNominationFile, selectedCount?: number) {
  const hasOneReporter = selectedCount !== undefined ? selectedCount == 1 : dossier.reporters.length === 1;
  if (!hasOneReporter) return false;

  const position = dossier.content.detectedTargetedFunctionId;
  if (
    // procureur général
    position === 'PG' ||
    // procureur de la République Financier
    position === 'PR F' ||
    // procureur de la République antiterroriste
    position === 'PRAT' ||
    // premier président de chambre
    position === '1PC'
  ) {
    return true;
  }

  const jurisdiction = dossier.content.detectedJurisdictionId;
  if (
    // premier avocat général à la CC
    (jurisdiction === 'CC  PARIS' && position === '1AG') ||
    // avocat général à la CC
    (jurisdiction === 'CC  PARIS' && position === 'AG') ||
    // procureur de la république près le tribunal judiciaire de Paris
    (jurisdiction === 'TJ  PARIS' && position === 'PR')
  ) {
    return true;
  }

  // Legacy: when we don't use data from LOLFI, we don't have functions' or jurisdictions' codes
  const search = unaccent(dossier.content.posteCible || '').toLowerCase();
  return (
    search &&
    [
      'procureur general',
      'premier avocat general pres la cour de cassation',
      'avocat general près la cour de cassation',
      'procureur pres la cour de cassation',
      'procureur national anti-terroriste',
      'procureur national financier',
      'premier president de chambre',
      'avocat general cc  paris',
      'premier avocat general cc  paris',
    ].some((position) => search.startsWith(position))
  );
}

export function ReportersAlert(props: { dossier: SessionNominationFile; selectedReportersCount?: number }) {
  const isSg = useIsSgNavigation();
  if (!isSg || !requires2Reporters(props.dossier, props.selectedReportersCount)) return null;

  return (
    /** @warning ".multi-reporters-alert" is used by the table CSS to display the orange row */
    <div className="multi-reporters-alert fr-pr-1v cursor-pointer">
      <Tooltip title="2 rapporteurs attendus">
        <i
          style={{
            color: colors.decisions.text.default.warning.default,
            backgroundColor: colors.decisions.background.contrast.warning.default,
          }}
          className={clsx(
            cx('fr-icon-warning-fill'),
            'text-center',
            'block',
            'rounded-full',
            'fr-p-1v',
            'size-6',
            'before:block',
            'before:content-[""]',
            'before:size-4!',
          )}
        />
      </Tooltip>
    </div>
  );
}
