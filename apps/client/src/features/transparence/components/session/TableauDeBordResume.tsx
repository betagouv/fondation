import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';
import { generatePath } from 'react-router';

import { useArchivedSession } from '@/shared/context/archived-session';
import { FormationEnumLabel } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedNominationSessionDto } from '@api/types';

import { TableauDeBordResumeDetails } from './TableauDeBordResumeDetails';
import { TransparenceActionsMenu } from './TransparenceActionsMenu';

export const TableauDeBordResume = (transparence: DetailedNominationSessionDto) => {
  const { isArchived } = useArchivedSession();

  return (
    <div className="fr-px-2v flex w-full flex-col gap-y-3">
      <h1 className="fr-mb-0 flex flex-wrap items-center gap-x-3 text-[1.75rem] leading-9 font-bold">
        <span className="fr-p-1v rounded-sm bg-(--background-contrast-grey) text-xs font-semibold text-(--text-mention-grey) uppercase">
          {FormationEnumLabel[transparence.formation]}
        </span>
        <span className="hyphens-auto">{transparence.name}</span>
      </h1>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <TableauDeBordResumeDetails {...transparence} />

        <div className="flex items-center gap-x-2">
          {!isArchived && (
            <Button
              iconId="fr-icon-settings-5-line"
              linkProps={{
                to: generatePath(ROUTE_PATHS.SG.SESSION_ID_EDIT, { sessionId: transparence.id }),
              }}
              priority="tertiary"
              size="small"
            >
              <FormattedMessage defaultMessage="Modifier" />
            </Button>
          )}

          <TransparenceActionsMenu transparence={transparence} />
        </div>
      </div>
    </div>
  );
};
