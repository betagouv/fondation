import clsx from 'clsx';
import { type FC } from 'react';
import { FormattedMessage } from 'react-intl';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { ObservationCard } from '@/features/observations/components/ObservationCard';
import { formatObservers } from '@/features/reports/utils/formatters';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MagistratAttachments } from './sections/MagistratAttachments';
import { MagistratBiography } from './sections/MagistratBiography';
import { MagistratCareerInfo } from './sections/MagistratCareerInfo';
import { MagistratHeader } from './sections/MagistratHeader';
import { MemberMemo } from './sections/MemberMemo';
import { SgComment } from './sections/SgComment';

export type MagistratDetailProps = {
  nominationFile: SessionNominationFile;
  sessionId: string;
};

export const MagistratDetail: FC<MagistratDetailProps> = ({ nominationFile, sessionId }) => {
  const isSg = useIsSgNavigation();
  const { historique, observants } = nominationFile.content;

  const formattedObservers = observants ? formatObservers(observants) : null;
  const observersCount = (observants?.length ?? 0) + (nominationFile.observations?.length ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <MagistratHeader nominationFile={nominationFile} sessionId={sessionId} />
      <MagistratCareerInfo content={nominationFile.content} />
      <MagistratBiography historique={historique} />

      <SgComment
        id={`${nominationFile.id}-comment-input`}
        initialComment={nominationFile.comment}
        nominationFileId={nominationFile.id}
      />

      <div>
        <label className="text-xl font-semibold">
          <FormattedMessage
            defaultMessage="{count, plural, =0 {Observant} one {Observant (#)} other {Observants (#)}}"
            values={{ count: observersCount }}
          />
        </label>
        {formattedObservers && (
          <div className="w-full leading-7 whitespace-pre-line">{formattedObservers}</div>
        )}
        {nominationFile.observations && nominationFile.observations.length > 0 && (
          <div className={clsx('grid grid-cols-1 gap-4 md:grid-cols-2', 'fr-mt-2v')}>
            {nominationFile.observations.map((observation) => (
              <ObservationCard
                key={observation.id}
                context={isSg ? 'sg' : 'membre'}
                nominationFileId={nominationFile.id}
                observation={observation}
                sessionId={sessionId}
              />
            ))}
          </div>
        )}
        {!formattedObservers && !(nominationFile.observations || []).length && (
          <div className="w-full leading-7 whitespace-pre-line">Aucun</div>
        )}
      </div>

      <MemberMemo memo={nominationFile.memo} nominationFileId={nominationFile.id} sessionId={sessionId} />

      <MagistratAttachments
        isArchived={nominationFile.isArchived}
        nominationFileId={nominationFile.id}
        sessionId={sessionId}
      />
    </div>
  );
};
