import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useArchivedSession } from '@/shared/context/archived-session';
import { FormationEnumMessages } from '@/shared/enums/formation.enum';
import { Collapse } from '@/shared/ui/collapse';
import { dateOnlyToIso, formatLongDateOnly } from '@/utils/date-only.util';
import type { DetailedNominationSessionDto } from '@api/types';

import { TableauDeBordEditTransparenceModal } from './TableauDeBordEditTransparenceModal';
import { TableauDeBordResumeDetails } from './TableauDeBordResumeDetails';
import { TransparenceActions } from './TransparenceActions';

export const TableauDeBordResume = (transparence: DetailedNominationSessionDto) => {
  const { isArchived } = useArchivedSession();
  const [editStatus, setEditStatus] = useState<'closing' | 'editing' | 'idle'>('idle');

  return (
    <div className="flex w-full flex-col">
      <h1 className="fr-h4 fr-mb-0 flex flex-wrap items-center gap-x-3">
        <Badge as="span">
          <FormattedMessage {...FormationEnumMessages[transparence.formation]} />
        </Badge>
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

      <Collapse>
        <div className="fr-pt-3v flex flex-wrap items-center gap-x-6 gap-y-2">
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
      </Collapse>

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
