import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';

import {
  useExcludedJurisdictionTitles,
  type ExcludedJurisdictionConflict,
} from '@/features/nomination-files-table/hooks/useExcludedJurisdictionConflicts.hook';

export function ExcludedJurisdictionAlert(props: { conflicts: readonly ExcludedJurisdictionConflict[] }) {
  const titles = useExcludedJurisdictionTitles(props.conflicts);
  if (props.conflicts.length === 0) return null;

  const title = [...titles.values()].join(' - ');

  return (
    /** @warning ".excluded-jurisdiction-alert" is used by the table CSS to display the red row */
    <Tooltip title={title}>
      <i
        className={clsx(cx('fr-icon-warning-fill'), 'excluded-jurisdiction-alert fr-icon--sm shrink-0')}
        style={{ color: colors.decisions.text.default.warning.default }}
      />
    </Tooltip>
  );
}
