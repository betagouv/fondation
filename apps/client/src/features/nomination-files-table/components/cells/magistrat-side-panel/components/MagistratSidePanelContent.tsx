import { useAuditionExpectation } from '../hooks/use-audition-expectation/use-audition-expectation.hook';
import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { Attachments } from './attachments/Attachments';
import { AuditionDate } from './audition-date/AuditionDate';
import { AuditionNotice } from './audition-date/AuditionNotice';
import { Biography } from './biography/Biography';
import { CareerInfo } from './career-info/CareerInfo';
import { Header } from './header/Header';
import { MemberMemo } from './member-memo/MemberMemo';
import { MissingEvaluation } from './missing-evaluation/MissingEvaluation';
import { Observations } from './observations/Observations';
import { Outcome } from './outcome/Outcome';
import { SgComment } from './sg-comment/SgComment';
import { Summary } from './summary/Summary';

export function MagistratSidePanelContent(props: {
  nominationFile: SessionNominationFile;
  sessionId: string;
}) {
  const { nominationFile, sessionId } = props;
  const { historique } = nominationFile.content;
  const { auditionMissing } = useAuditionExpectation(nominationFile);
  const isSgContext = useIsSgNavigation();
  const auditionEditable = isSgContext && nominationFile.canScheduleAudition;

  return (
    <div className="flex flex-col gap-10 pb-10">
      <Header key={nominationFile.id} nominationFile={nominationFile} sessionId={sessionId} />
      <div className="-mt-10 *:border-t *:border-(--border-open-blue-france)">
        <AuditionNotice
          auditionDate={nominationFile.auditionDate}
          auditionMissing={auditionMissing}
          auditionTime={nominationFile.auditionTime}
          editable={auditionEditable}
        />
        <MissingEvaluation
          editable={isSgContext}
          key={`${nominationFile.id}-missing-evaluation`}
          nominationFile={nominationFile}
          sessionId={sessionId}
        />
      </div>
      <Outcome key={`${nominationFile.id}-outcome`} nominationFile={nominationFile} />
      <CareerInfo content={nominationFile.content} />
      <Biography historique={historique} />
      <Observations nominationFile={nominationFile} sessionId={sessionId} />
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
      <Attachments
        isArchived={nominationFile.isArchived}
        nominationFileId={nominationFile.id}
        sessionId={sessionId}
      />
      <Summary nominationFile={nominationFile} sessionId={sessionId} />
      {isSgContext && (
        <AuditionDate
          editable={auditionEditable}
          key={`${nominationFile.id}-audition`}
          nominationFile={nominationFile}
        />
      )}
    </div>
  );
}
