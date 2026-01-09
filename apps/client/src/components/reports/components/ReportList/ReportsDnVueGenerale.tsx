import { parseAsArrayOf, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';
import { useParams } from 'react-router-dom';

import { useServerPagination } from '@/hooks/useServerPagination.hook';
import {
  useSessionNominationFilesQuery,
  type NominationFileSortField
} from '@queries/nomination-sessions.queries';
import { PrioriteEnum, type FormationEnum } from '@/types/enums.types';

import { ErrorMessage } from '../../../shared/ErrorMessage';
import { TableauDossiersDeNomination } from '../../../shared/TableauDossiersDeNomination';
import { TransparencyAttachmentsSection } from './TransparencyAttachmentsSection';

type ReportsDnVueGeneraleProps = React.PropsWithChildren<{
  formation: FormationEnum;
}>;

export const ReportsDnVueGenerale = ({ formation, children }: ReportsDnVueGeneraleProps) => {
  const { sessionId } = useParams();

  const { page, limit, sortField, sortDirection, setPage, setLimit, setSort, getSortIcon } =
    useServerPagination({ defaultLimit: 20 });

  const [filters] = useQueryStates({
    rapporteurs: parseAsArrayOf(parseAsString).withDefault([]),
    priorite: parseAsArrayOf(parseAsStringEnum(Object.values(PrioriteEnum))).withDefault([])
  });

  const {
    data: dossiersResponse,
    isLoading: isLoadingDossiersDeNomination,
    isError: isErrorDossiersDeNomination
  } = useSessionNominationFilesQuery({
    sessionId: sessionId as string,
    page,
    limit,
    sortField: sortField as NominationFileSortField | undefined,
    sortDirection,
    priorities: filters.priorite.length > 0 ? filters.priorite : undefined,
    reporterIds: filters.rapporteurs.length > 0 ? filters.rapporteurs : undefined
  });

  if (isLoadingDossiersDeNomination) {
    return <div>Chargement des dossiers de nomination...</div>;
  }

  if (isErrorDossiersDeNomination) {
    return <ErrorMessage message="Erreur lors du chargement des dossiers de nomination..." />;
  }

  const totalCount = dossiersResponse?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="my-4 flex flex-col gap-4">
      <TableauDossiersDeNomination
        dossiersDeNomination={dossiersResponse?.items || []}
        formation={formation}
        sessionId={sessionId!}
        serverPagination={{
          page,
          limit,
          totalCount,
          totalPages,
          setPage,
          setLimit,
          sortField,
          sortDirection,
          setSort,
          getSortIcon
        }}
      >
        {children}
      </TableauDossiersDeNomination>
      <TransparencyAttachmentsSection sessionId={sessionId as string} />
    </div>
  );
};
