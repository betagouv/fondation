import Button from '@codegouvfr/react-dsfr/Button';
import { useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { FormationBadge } from '@/shared/components/formation-badge';
import { useArchivedSession } from '@/shared/context/archived-session';
import { Collapse } from '@/shared/ui/collapse';
import { dateOnlyToIso, formatLongDateOnly } from '@/utils/date-only.util';
import type { DetailedNominationSessionDto } from '@api/types';

import { TableauDeBordEditTransparenceModal } from './TableauDeBordEditTransparenceModal';
import { TableauDeBordResumeDetails } from './TableauDeBordResumeDetails';
import { TransparenceActions } from './TransparenceActions';

export const TableauDeBordResume = (transparence: DetailedNominationSessionDto) => {
  const { isArchived } = useArchivedSession();
  const [editStatus, setEditStatus] = useState<'closing' | 'editing' | 'idle'>('idle');
  const titleRef = useRef<HTMLHeadingElement>(null);

  return (
    <div className="flex w-full flex-col">
      <h1 className="fr-h4 fr-mb-0 flex flex-wrap items-center gap-x-3" ref={titleRef} tabIndex={-1}>
        <FormationBadge formation={transparence.formation} />
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

          {/* the archive button disappears once archived: the focus goes to the title */}
          <TransparenceActions onArchived={() => titleRef.current?.focus()} transparence={transparence} />
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
