import { NominationSessionAttachmentList } from '@/features/transparence/components/NominationSessionAttachmentList';

type TransparencyAttachmentsSectionProps = {
  sessionId: string;
};

export const TransparencyAttachmentsSection = ({ sessionId }: TransparencyAttachmentsSectionProps) => {
  return (
    <div>
      <h2>Pièces jointes</h2>
      <NominationSessionAttachmentList sessionId={sessionId} />
    </div>
  );
};
