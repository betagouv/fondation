import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { type FC } from 'react';
import { FormattedMessage } from 'react-intl';

import { useObservationsModal } from '../../observations/ObservationsModalContext';
import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { ObservationCard } from '@/features/observations/components/ObservationCard';
import { formatObservers } from '@/features/reports/utils/formatters';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MagistratAttachments } from './sections/MagistratAttachments';
import { MagistratBiography } from './sections/MagistratBiography';
import { MagistratCareerInfo } from './sections/MagistratCareerInfo';
import { MagistratHeader } from './sections/MagistratHeader';
import { MagistratSummary } from './sections/MagistratSummary';
import { MemberMemo } from './sections/MemberMemo';
import { SgComment } from './sections/SgComment';

export type MagistratDetailProps = {
  nominationFile: SessionNominationFile;
  sessionId: string;
};

export const MagistratDetail: FC<MagistratDetailProps> = ({ nominationFile, sessionId }) => {
  const isSg = useIsSgNavigation();
  const { open } = useObservationsModal();
  const { historique, observants } = nominationFile.content;

  const formattedObservers = observants ? formatObservers(observants) : null;
  const observersCount = (observants?.length ?? 0) + (nominationFile.observations?.length ?? 0);

  const handleAddObservation = () =>
    open({ id: nominationFile.id, sessionId, name: nominationFile.content.nomMagistrat }, 'create');

  return (
    <div className="flex flex-col gap-8">
      <MagistratHeader nominationFile={nominationFile} sessionId={sessionId} />
      <MagistratCareerInfo content={nominationFile.content} />
      <MagistratBiography historique={historique} />

      <div>
        <div className="flex items-center justify-between gap-2">
          <label className="text-xl font-semibold">
            <FormattedMessage
              defaultMessage="{count, plural, one {Observant} other {Observants}}"
              values={{ count: observersCount }}
            />
          </label>
          {isSg && (
            <Button onClick={handleAddObservation} priority="secondary" size="small">
              <FormattedMessage defaultMessage="Ajouter" />
            </Button>
          )}
        </div>
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
          <div className="w-full leading-7 whitespace-pre-line">
            <FormattedMessage defaultMessage="Aucun" />
          </div>
        )}
      </div>

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
};
