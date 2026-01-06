import { useParams } from 'react-router-dom';
import { ErrorMessage } from '../../../shared/ErrorMessage';
import { TableauDossiersDeNomination } from '../../../shared/TableauDossiersDeNomination';
import { useSessionNominationFilesQuery } from '@queries/nomination-sessions.queries';
import { TransparencyAttachmentsSection } from './TransparencyAttachmentsSection';
import type { FormationEnum } from '@/types/enums.types';

type ReportsDnVueGeneraleProps = React.PropsWithChildren<{
  formation: FormationEnum;
}>;

export const ReportsDnVueGenerale = ({ formation, children }: ReportsDnVueGeneraleProps) => {
  const { sessionId } = useParams();
  const {
    data,
    isLoading: isLoadingDossiersDeNomination,
    isError: isErrorDossiersDeNomination
  } = useSessionNominationFilesQuery({
    sessionId: sessionId as string
  });

  if (isLoadingDossiersDeNomination) {
    return <div>Chargement des dossiers de nomination...</div>;
  }

  if (isErrorDossiersDeNomination) {
    return <ErrorMessage message="Erreur lors du chargement des dossiers de nomination..." />;
  }

  return (
    <div className="my-4 flex flex-col gap-4">
      <TableauDossiersDeNomination dossiersDeNomination={data?.items || []} formation={formation}>
        {children}
      </TableauDossiersDeNomination>
      <TransparencyAttachmentsSection sessionId={sessionId as string} />
    </div>
  );
};
