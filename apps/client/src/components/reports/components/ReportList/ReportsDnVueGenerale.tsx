import { useParams } from 'react-router-dom';
import { useGetDossierDeNominationParSession } from '../../../../react-query/queries/sg/get-dossier-de-nomination-par-session.query';
import { ErrorMessage } from '../../../shared/ErrorMessage';
import { TableauDossiersDeNomination } from '../../../shared/TableauDossiersDeNomination';

export const ReportsDnVueGenerale = () => {
  const { sessionId } = useParams();
  const {
    data: dossiersDeNomination,
    isLoading: isLoadingDossiersDeNomination,
    isError: isErrorDossiersDeNomination
  } = useGetDossierDeNominationParSession({
    sessionId: sessionId as string
  });

  if (isLoadingDossiersDeNomination) {
    return <div>Chargement des dossiers de nomination...</div>;
  }

  if (isErrorDossiersDeNomination) {
    return <ErrorMessage message="Erreur lors du chargement des dossiers de nomination..." />;
  }

  return (
    <div>
      <TableauDossiersDeNomination dossiersDeNomination={dossiersDeNomination || []} />
    </div>
  );
};
