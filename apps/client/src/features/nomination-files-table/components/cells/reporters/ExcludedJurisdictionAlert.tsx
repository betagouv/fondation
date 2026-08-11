import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';

import './ExcludedJurisdictionAlert.css';

import { useExcludedJurisdictionTitles } from '@/features/nomination-files-table/context/excluded-jurisdictions.context';
import { type ExcludedJurisdictionConflict } from '@/features/nomination-files-table/context/member-excluded-jurisdictions';

export function ExcludedJurisdictionAlert(props: { conflicts: readonly ExcludedJurisdictionConflict[] }) {
  const titles = useExcludedJurisdictionTitles(props.conflicts);
  if (props.conflicts.length === 0) return null;

  const title = [...titles.values()].join(' - ');

  return (
    /** @warning ".excluded-jurisdiction-alert" is used by {@link ExcludedJurisdictionAlert.css} */
    <Tooltip title={title}>
      <i
        className={clsx(cx('fr-icon-warning-fill'), 'excluded-jurisdiction-alert fr-icon--sm shrink-0')}
        style={{ color: colors.decisions.text.default.warning.default }}
      />
    </Tooltip>
  );
}
