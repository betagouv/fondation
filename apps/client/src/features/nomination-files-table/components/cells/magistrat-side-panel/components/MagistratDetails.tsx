import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MagistratAttachments } from './magistrat-attachments/MagistratAttachments';
import { MagistratAuditionDate } from './magistrat-audition-date/MagistratAuditionDate';
import { MagistratAuditionNotice } from './magistrat-audition-date/MagistratAuditionNotice';
import { MagistratBiography } from './magistrat-biography/MagistratBiography';
import { MagistratCareerInfo } from './magistrat-career-info/MagistratCareerInfo';
import { MagistratHeader } from './magistrat-header/MagistratHeader';
import { MagistratObservationsInbox } from './magistrat-observations/MagistratObservationsInbox';
import { MagistratOutcome } from './magistrat-outcome/MagistratOutcome';
import { MagistratSummary } from './magistrat-summary/MagistratSummary';
import { MemberMemo } from './member-memo/MemberMemo';
import { SgComment } from './sg-comment/SgComment';

export function MagistratDetails(props: { nominationFile: SessionNominationFile; sessionId: string }) {
  const { nominationFile, sessionId } = props;
  const { historique } = nominationFile.content;
  const auditionEditable = useIsSgNavigation() && nominationFile.canScheduleAudition;

  return (
    <div className="flex flex-col gap-10 pb-10">
      <MagistratHeader key={nominationFile.id} nominationFile={nominationFile} sessionId={sessionId} />
      <MagistratAuditionNotice
        auditionDate={nominationFile.auditionDate}
        auditionTime={nominationFile.auditionTime}
        editable={auditionEditable}
      />
      <MagistratOutcome key={`${nominationFile.id}-outcome`} nominationFile={nominationFile} />
      <MagistratCareerInfo content={nominationFile.content} />
      <MagistratBiography historique={historique} />
      <MagistratObservationsInbox nominationFile={nominationFile} sessionId={sessionId} />
      <SgComment
        key={`${nominationFile.id}-comment`}
        initialComment={nominationFile.comment}
        nominationFileId={nominationFile.id}
      />
      <MemberMemo
        key={`${nominationFile.id}-memo`}
        memo={nominationFile.memo}
        nominationFileId={nominationFile.id}
        sessionId={sessionId}
      />
      <MagistratAttachments
        isArchived={nominationFile.isArchived}
        nominationFileId={nominationFile.id}
        sessionId={sessionId}
      />
      <MagistratSummary nominationFile={nominationFile} sessionId={sessionId} />
      <MagistratAuditionDate
        editable={auditionEditable}
        key={`${nominationFile.id}-audition`}
        nominationFile={nominationFile}
      />
    </div>
  );
}
