import { useParams } from 'react-router-dom';
import { TransparencyAttachmentsSection } from './TransparencyAttachmentsSection';

export const ReportsDnVueGenerale = () => {
  const { sessionId } = useParams();

  return (
    <div className="my-4 flex flex-col gap-4">
      {/* <ObservationsModalProvider>
        <TableauDossiersDeNomination
          dossiersDeNomination={data?.items || []}
          formation={formation}
          sessionId={sessionId!}
        >
          {children}
        </TableauDossiersDeNomination>
      </ObservationsModalProvider> */}
      <TransparencyAttachmentsSection sessionId={sessionId as string} />
    </div>
  );
};
