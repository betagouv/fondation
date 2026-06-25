import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MagistratAttachments } from './magistrat-attachments/MagistratAttachments';
import { MagistratBiography } from './magistrat-biography/MagistratBiography';
import { MagistratCareerInfo } from './magistrat-career-info/MagistratCareerInfo';
import { MagistratHeader } from './magistrat-header/MagistratHeader';
import { MagistratObservations } from './magistrat-observations/MagistratObservations';
import { MagistratSummary } from './magistrat-summary/MagistratSummary';
import { MemberMemo } from './member-memo/MemberMemo';
import { SgComment } from './sg-comment/SgComment';

export function MagistratDetails(props: { nominationFile: SessionNominationFile; sessionId: string }) {
  const { nominationFile, sessionId } = props;
  const { historique } = nominationFile.content;

  return (
    <div className="flex flex-col gap-8">
      <MagistratHeader key={nominationFile.id} nominationFile={nominationFile} sessionId={sessionId} />
      <MagistratCareerInfo content={nominationFile.content} />
      <MagistratBiography historique={historique} />
      <MagistratObservations nominationFile={nominationFile} sessionId={sessionId} />
      <SgComment
        id={`${nominationFile.id}-comment-input`}
        initialComment={nominationFile.comment}
        nominationFileId={nominationFile.id}
      />
      <MemberMemo memo={nominationFile.memo} nominationFileId={nominationFile.id} sessionId={sessionId} />
      <MagistratAttachments
        isArchived={nominationFile.isArchived}
        nominationFileId={nominationFile.id}
        sessionId={sessionId}
      />
      <MagistratSummary nominationFile={nominationFile} sessionId={sessionId} />
    </div>
  );
}
