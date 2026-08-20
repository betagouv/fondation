import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, type PropsWithChildren } from 'react';
import { useIntl } from 'react-intl';

import type { SessionOutcome } from '../context/files-table.context';
import { NominationFilesTableProvider } from '../context/NominationFilesTableProvider';
import { useSessionFilesFilters } from '../hooks/useSessionFilesFilters';
import { PriorityBadgeList } from '@/shared/components/priority-badge';
import { rowCell } from '@/shared/ui/new-table';
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
import { NominationFilesExportButton } from './NominationFilesExportButton';
import { NominationFilesPublishButton } from './NominationFilesPublishButton';
import { NominationFilesStatusBadges } from './NominationFilesStatusBadges';
import { SessionFilesTable } from './SessionFilesTable';

const h = createColumnHelper<SessionNominationFile>();

const fileNumberCell = rowCell<SessionNominationFile>((file) => file.content.numeroDeDossier);
const magistratCell = rowCell<SessionNominationFile>((file) => <SidePanelTrigger nominationFile={file} />);
const posteCibleCell = rowCell<SessionNominationFile>((file) => (
  <NominationFileTargetPositionCell nominationFile={file} />
));
const observantsCell = rowCell<SessionNominationFile>((file) => <ObservantsCell nominationFile={file} />);
const prioritiesCell = rowCell<SessionNominationFile>((file) => (
  <PriorityBadgeList priorities={file.priorities} />
));
const reportersCell = rowCell<SessionNominationFile>((file) => <ReportersCell dossier={file} />);
const outcomeCell = rowCell<SessionNominationFile>((file) => <NominationFileOutcome nominationFile={file} />);
const statusCell = rowCell<SessionNominationFile>((file) => (
  <NominationFileStatusCell status={file.content.status} />
));

function useSgSessionFilesColumns() {
  const { formatMessage } = useIntl();
  const filters = useSessionFilesFilters();

  return useMemo(
    () => [
      h.accessor('content.numeroDeDossier', {
        id: 'fileNumber',
        cell: fileNumberCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'N°' }),
        size: 42,
        sortDescFirst: true,
      }),

      h.accessor('content.nomMagistrat', {
        id: 'name',
        cell: magistratCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Magistrat' }),
        size: 250,
      }),

      h.accessor('content.posteCible', {
        id: 'targetedGrade',
        cell: posteCibleCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Poste cible' }),
        size: 240,
        sortDescFirst: true,
      }),

      h.accessor('content.observants', {
        cell: observantsCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Observant(s)' }),
        size: 170,
      }),

      h.accessor('priorities', {
        cell: prioritiesCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Priorité(s)' }),
        meta: { filters: filters.priorities },
        size: 110,
      }),

      h.accessor('reporters', {
        cell: reportersCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Rapporteur(s)' }),
        meta: { filters: filters.reporters },
        size: 130,
      }),

      h.accessor('content.outcome', {
        cell: outcomeCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Issue' }),
        meta: { filters: filters.outcomes },
        size: 80,
      }),

      h.accessor('content.status', {
        cell: statusCell,
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

function SgSessionFilesTableInner(props: PropsWithChildren<{ filtersSlot?: Element | null }>) {
  const columns = useSgSessionFilesColumns();

  return (
    <SessionFilesTable columns={columns} filtersSlot={props.filtersSlot}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <NominationFilesAffectationsStatus />
          <NominationFilesStatusBadges />
        </div>

        <div className="flex items-center gap-2">
          <NominationFilesExportButton />
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
    filtersSlot?: Element | null;
    formation: FormationEnum;
    outcomes: readonly SessionOutcome[];
    sessionId: string;
  }>,
) {
  return (
    <NominationFilesTableProvider {...props}>
      <SgSessionFilesTableInner filtersSlot={props.filtersSlot}>{props.children}</SgSessionFilesTableInner>
    </NominationFilesTableProvider>
  );
}
