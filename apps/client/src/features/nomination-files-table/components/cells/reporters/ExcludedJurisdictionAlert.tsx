import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';

import { useExcludedJurisdictionTitles } from '@/features/nomination-files-table/context/excluded-jurisdictions.context';
import { type ExcludedJurisdictionConflict } from '@/features/nomination-files-table/context/member-excluded-jurisdictions';
import { Tooltip } from '@/shared/ui/tooltip';

export function ExcludedJurisdictionAlert(props: { conflicts: readonly ExcludedJurisdictionConflict[] }) {
  const titles = useExcludedJurisdictionTitles(props.conflicts);
  if (props.conflicts.length === 0) return null;

  const title = [...titles.values()].join(' - ');

  return (
    <Tooltip label={title}>
      <i
        className={clsx(cx('fr-icon-warning-fill'), 'fr-icon--sm shrink-0')}
        style={{ color: colors.decisions.text.default.warning.default }}
      />
    </Tooltip>
  );
}
