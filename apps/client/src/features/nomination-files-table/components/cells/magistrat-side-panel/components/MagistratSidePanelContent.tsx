import { useAuditionExpectation } from '../hooks/use-audition-expectation/use-audition-expectation.hook';
import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { Observations } from '@/features/observations/components/observations-section/Observations';
import { Summary } from '@/features/summary/components/summary-section/Summary';
import { Attachments } from '@/features/transparence/components/nomination-file-attachments/Attachments';
import { isUpdatable, type SessionNominationFile } from '@queries/nomination-sessions.queries';

import { AuditionBanner } from './audition-date/AuditionBanner';
import { AuditionDate } from './audition-date/AuditionDate';
import { Biography } from './biography/Biography';
import { CareerInfo } from './career-info/CareerInfo';
import { FrozenFileBanner } from './frozen-file/FrozenFileBanner';
import { Header } from './header/Header';
import { MemberMemo } from './member-memo/MemberMemo';
import { MissingEvaluation } from './missing-evaluation/MissingEvaluation';
import { Outcome } from './outcome/Outcome';
import { SgComment } from './sg-comment/SgComment';

export function MagistratSidePanelContent(props: {
  nominationFile: SessionNominationFile;
  sessionId: string;
}) {
  const { nominationFile, sessionId } = props;
  const { historique } = nominationFile.content;
  const { auditionMissing } = useAuditionExpectation(nominationFile);
  const isSgContext = useIsSgNavigation();
  const auditionEditable = isSgContext && nominationFile.canScheduleAudition;
  const { lockedReason } = nominationFile.content;

  return (
    <div className="flex flex-col gap-10 pb-10">
      <Header key={nominationFile.id} nominationFile={nominationFile} sessionId={sessionId} />
      <div className="-mt-10 *:border-t *:border-(--border-open-blue-france)">
        {lockedReason && <FrozenFileBanner lockedReason={lockedReason} />}
        <AuditionBanner
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
      <Observations
        magistratName={nominationFile.content.nomMagistrat}
        nominationFileId={nominationFile.id}
        observers={nominationFile.content.observants ?? null}
        sessionId={sessionId}
      />
      <SgComment
        key={`${nominationFile.id}-comment`}
        initialComment={nominationFile.comment}
        nominationFileId={nominationFile.id}
      />
      <Attachments
        isUpdatable={isUpdatable(nominationFile)}
        nominationFileId={nominationFile.id}
        sessionId={sessionId}
      />
      <Summary
        canRead={!!nominationFile.summary?.canRead}
        hasSummary={!!nominationFile.summary}
        nominationFileId={nominationFile.id}
        sessionId={sessionId}
        withOpenLink
      />
      {isSgContext && (
        <AuditionDate
          editable={auditionEditable}
          key={`${nominationFile.id}-audition`}
          nominationFile={nominationFile}
        />
      )}
      <MemberMemo
        key={`${nominationFile.id}-memo`}
        memo={nominationFile.memo}
        nominationFileId={nominationFile.id}
        sessionId={sessionId}
      />
    </div>
  );
}
