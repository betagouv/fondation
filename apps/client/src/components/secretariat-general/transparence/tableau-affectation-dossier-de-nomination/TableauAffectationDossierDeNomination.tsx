import { useParams } from 'react-router-dom';
import { useGetDossierDeNominationParSession } from '../../../../react-query/queries/sg/get-dossier-de-nomination-par-session.query';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { ErrorMessage } from '../../../shared/ErrorMessage';
import { TableauDossiersDeNomination } from '../../../shared/TableauDossiersDeNomination';
import { ExcelExport } from './ExcelExport';
import type { Magistrat } from 'shared-models';
import type { FC } from 'react';

export type TableauAffectationDossierDeNominationProps = {
  formation: Magistrat.Formation;
};

export const TableauAffectationDossierDeNomination: FC<TableauAffectationDossierDeNominationProps> = ({
  formation
}) => {
  const { sessionId } = useParams();
  const {
    data,
    isLoading: isLoadingDossiersDeNomination,
    isError: isErrorDossiersDeNomination
  } = useGetDossierDeNominationParSession({
    sessionId: sessionId as string,
    formation
  });

  if (isLoadingDossiersDeNomination) {
    return <div>Chargement des dossiers de nomination...</div>;
  }

  if (isErrorDossiersDeNomination) {
    return <ErrorMessage message="Erreur lors de la récupération des dossiers de nomination" />;
  }

  return (
    <div id="session-affectation-dossier-de-nomination" className={cx('fr-py-1v')}>
      <TableauDossiersDeNomination
        dossiersDeNomination={data?.dossiers || []}
        showExportButton={true}
        ExportComponent={ExcelExport}
        canEdit={true}
      />
    </div>
  );
};
