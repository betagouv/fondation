import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { parseAsArrayOf, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';
import type { FC } from 'react';
import { useParams } from 'react-router-dom';

import { useMemberListQuery } from '@/queries/members.queries';
import {
  useSessionNominationFilesQuery,
  type NominationFileSortField
} from '@queries/nomination-sessions.queries';

import { PrioriteEnum, type FormationEnum } from '@/types/enums.types';

import { AlertsProvider } from '@/components/shared/alerts/AlertsProvider';
import { useServerPagination } from '@/hooks/useServerPagination.hook';
import { ErrorMessage } from '../../../shared/ErrorMessage';
import { TableauDossiersDeNomination } from '../../../shared/TableauDossiersDeNomination';
import { TableauAffectationDossierDeNominationStatus } from './TableauAffectationDossiersDeNominationStatus';

export type TableauAffectationDossierDeNominationProps = {
  formation: FormationEnum;
};

export const TableauAffectationDossierDeNomination: FC<TableauAffectationDossierDeNominationProps> = ({
  formation
}) => {
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

  const {
    data: rapporteursData,
    isLoading: isLoadingRapporteurs,
    isError: isErrorRapporteurs
  } = useMemberListQuery({ formation, limit: 100 });

  if (isLoadingDossiersDeNomination || isLoadingRapporteurs) {
    return <div className="fr-container pb-8">Chargement des dossiers de nomination...</div>;
  }

  if (isErrorDossiersDeNomination || isErrorRapporteurs) {
    return <ErrorMessage message="Erreur lors de la récupération des données" />;
  }

  const totalCount = dossiersResponse?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <div id="session-affectation-dossier-de-nomination">
        <AlertsProvider>
          <div className={clsx(`flex items-end justify-between px-0`, cx('fr-container'))}>
            <TableauAffectationDossierDeNominationStatus sessionId={sessionId as string} />

            <AlertsProvider.Alerts small className="my-3 flex-shrink-0" />
          </div>

          <TableauDossiersDeNomination
            dossiersDeNomination={dossiersResponse?.items || []}
            availableRapporteurs={(rapporteursData?.items || []).map(({ id, firstName, lastName }) => ({
              userId: id,
              firstName,
              lastName
            }))}
            canEdit={true}
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
          />
        </AlertsProvider>
      </div>
    </>
  );
};
