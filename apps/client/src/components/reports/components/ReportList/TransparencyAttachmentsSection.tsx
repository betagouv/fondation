import { useGetTransparencyAttachmentsQuery } from '../../../../react-query/queries/get-transparency-attachments.query';
import { TransparencyFilesList } from './TransparencyFilesList';

type TransparencyAttachmentsSectionProps = {
  sessionImportId: string;
};

export const TransparencyAttachmentsSection = ({ sessionImportId }: TransparencyAttachmentsSectionProps) => {
  const {
    data: attachments,
    isLoading: isAttachmentsLoading,
    isError: isAttachmentsError
  } = useGetTransparencyAttachmentsQuery(sessionImportId);

  if (isAttachmentsLoading || isAttachmentsError || !attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div>
      <h2>Pièces jointes</h2>
      <TransparencyFilesList files={attachments} />
    </div>
  );
};
