import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';

import { unaccent } from '@/utils/string.utils';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

function requires2Reporters(dossier: SessionNominationFile, selectedCount?: number) {
  const search = unaccent(dossier.content.posteCible || '').toLowerCase();
  return (
    (selectedCount !== undefined ? selectedCount == 1 : dossier.reporters.length === 1) &&
    search &&
    [
      'procureur general',
      'premier avocat general pres la cour de cassation',
      'avocat general près la cour de cassation',
      'procureur pres la cour de cassation',
      'procureur national anti-terroriste',
      'procureur national financier',
      'premier president de chambre',
      'avocat general cc  paris'
    ].some((position) => search.startsWith(position))
  );
}

export function ReportersAlert(props: { dossier: SessionNominationFile; selectedReportersCount?: number }) {
  if (!requires2Reporters(props.dossier, props.selectedReportersCount)) return null;

  return (
    /** @warning ".multi-reporters-alert" is used by the table CSS to display the orange row */
    <div className="multi-reporters-alert cursor-pointer pr-1">
      <Tooltip title="2 rapporteurs attendus">
        <i
          style={{
            color: colors.decisions.text.default.warning.default,
            backgroundColor: colors.decisions.background.contrast.warning.default
          }}
          className={clsx(
            cx('fr-icon-warning-fill'),
            'text-center',
            'block',
            'rounded-full',
            'p-1',
            'size-6',
            'before:block',
            'before:content-[""]',
            'before:size-4'
          )}
        />
      </Tooltip>
    </div>
  );
}
