import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, type PropsWithChildren, type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import type { SessionOutcome } from '../context/files-table.context';
import { NominationFilesTableProvider } from '../context/NominationFilesTableProvider';
import { useSessionFilesFilters } from '../hooks/useSessionFilesFilters';
import { PriorityBadgeList } from '@/shared/components/priority-badge';
import type { FormationEnum } from '@/types/enums.types';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { SidePanelTrigger } from './cells/magistrat-side-panel/components/SidePanelTrigger';
import { NominationFileOutcome } from './cells/nomination-file-outcome/NominationFileOutcome';
import { NominationFileStatusCell } from './cells/NominationFileStatusCell';
import { ObservantsCell } from './cells/observations/ObservantsCell';
import { ReportersCell } from './cells/reporters/ReportersCell';
import { NominationFileTargetPositionCell } from './cells/targeted-position/NominationFileTargetPositionCell';
import { NominationFilesAffectationsStatus } from './NominationFilesAffectationsStatus';
import { NominationFilesAutoAffectationButton } from './NominationFilesAutoAffectationButton';
import { NominationFilesPublishButton } from './NominationFilesPublishButton';
import { NominationFilesStatusBadges } from './NominationFilesStatusBadges';
import { SessionFilesTable } from './SessionFilesTable';

const h = createColumnHelper<SessionNominationFile>();

function useSgSessionFilesColumns() {
  const { formatMessage } = useIntl();
  const filters = useSessionFilesFilters();

  return useMemo(
    () => [
      h.accessor('content.numeroDeDossier', {
        id: 'fileNumber',
        cell: ({ cell }) => cell.getValue(),
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'N°' }),
        size: 42,
        sortDescFirst: true,
      }),

      h.accessor('content.nomMagistrat', {
        id: 'name',
        cell: ({ row }) => <SidePanelTrigger nominationFile={row.original} />,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Magistrat' }),
        size: 250,
      }),

      h.accessor('content.posteCible', {
        id: 'targetedGrade',
        cell: ({ row }) => <NominationFileTargetPositionCell nominationFile={row.original} />,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Poste cible' }),
        size: 240,
        sortDescFirst: true,
      }),

      h.accessor('content.observants', {
        cell: ({ row }) => <ObservantsCell nominationFile={row.original} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Observant(s)' }),
        size: 170,
      }),

      h.accessor('priorities', {
        cell: ({ row }) => <PriorityBadgeList priorities={row.original.priorities} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Priorité(s)' }),
        meta: { filters: filters.priorities },
        size: 110,
      }),

      h.accessor('reporters', {
        cell: ({ row }) => <ReportersCell dossier={row.original} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Rapporteur(s)' }),
        meta: { filters: filters.reporters },
        size: 130,
      }),

      h.accessor('content.outcome', {
        cell: ({ row }) => <NominationFileOutcome nominationFile={row.original} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Issue' }),
        meta: { filters: filters.outcomes },
        size: 80,
      }),

      h.accessor('content.status', {
        cell: ({ cell }) => <NominationFileStatusCell status={cell.getValue()} />,
        enableSorting: false,
        header: () => (
          <span className="block text-center">{formatMessage({ defaultMessage: 'Statut' })}</span>
        ),
        size: 120,
      }),
    ],
    [filters, formatMessage],
  );
}

function SgSessionFilesTableInner(props: PropsWithChildren<{ toolbar?: ReactNode }>) {
  const columns = useSgSessionFilesColumns();

  return (
    <SessionFilesTable columns={columns}>
      {props.toolbar}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <NominationFilesAffectationsStatus />
          <NominationFilesStatusBadges />
        </div>

        <div className="flex items-center gap-2">
          <NominationFilesAutoAffectationButton />
          <NominationFilesPublishButton />
        </div>
      </div>

      {props.children}
    </SessionFilesTable>
  );
}

export function SgSessionFilesTable(
  props: PropsWithChildren<{
    canManage?: boolean;
    formation: FormationEnum;
    outcomes: readonly SessionOutcome[];
    sessionId: string;
    toolbar?: ReactNode;
  }>,
) {
  return (
    <NominationFilesTableProvider {...props}>
      <SgSessionFilesTableInner toolbar={props.toolbar}>{props.children}</SgSessionFilesTableInner>
    </NominationFilesTableProvider>
  );
}
