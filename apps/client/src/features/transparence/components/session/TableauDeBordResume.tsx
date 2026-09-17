import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useArchivedSession } from '@/shared/context/archived-session';
import { FormationEnumMessages } from '@/shared/enums/formation.enum';
import { dateOnlyToIso, formatLongDateOnly } from '@/utils/date-only.util';
import type { DetailedNominationSessionDto } from '@api/types';

import { TableauDeBordEditTransparenceModal } from './TableauDeBordEditTransparenceModal';
import { TableauDeBordResumeDetails } from './TableauDeBordResumeDetails';
import { TransparenceActions } from './TransparenceActions';

export const TableauDeBordResume = ({
  dense,
  ...transparence
}: DetailedNominationSessionDto & { dense?: boolean }) => {
  const { isArchived } = useArchivedSession();
  const [editStatus, setEditStatus] = useState<'closing' | 'editing' | 'idle'>('idle');

  return (
    <div className="flex w-full flex-col gap-y-3">
      <h1 className="fr-mb-0 flex flex-wrap items-center gap-x-3 text-2xl font-bold">
        <span className="fr-p-1v rounded-sm bg-(--background-contrast-grey) text-xs font-semibold text-(--text-mention-grey) uppercase">
          <FormattedMessage {...FormationEnumMessages[transparence.formation]} />
        </span>
        <span className="hyphens-auto text-(--text-title-blue-france)">{transparence.name}</span>
        {transparence.date && (
          <>
            <span aria-hidden className="text-(--text-title-blue-france)">
              -
            </span>
            <time className="text-(--text-default-grey)" dateTime={dateOnlyToIso(transparence.date)}>
              {formatLongDateOnly(transparence.date)}
            </time>
          </>
        )}
      </h1>

      {!dense && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <TableauDeBordResumeDetails {...transparence} />

          {!isArchived && (
            <Button
              className="min-h-9! py-1.5!"
              iconId="fr-icon-settings-5-line"
              onClick={() => setEditStatus('editing')}
              priority="tertiary"
              size="small"
            >
              <FormattedMessage defaultMessage="Modifier" />
            </Button>
          )}

          <TransparenceActions transparence={transparence} />
        </div>
      )}

      {editStatus !== 'idle' && (
        <TableauDeBordEditTransparenceModal
          onClose={() => setEditStatus('closing')}
          onClosed={() => setEditStatus('idle')}
          open={editStatus === 'editing'}
          session={transparence}
        />
      )}
    </div>
  );
};
