import clsx from 'clsx';
import { type FC } from 'react';
import { FormattedMessage } from 'react-intl';

import { formatBiography, formatObservers } from '@/components/reports/components/ReportOverview/formatters';
import { reportHtmlIds } from '@/components/reports/dom/html-ids';
import { LolfiMagistratLink } from '@/components/shared/LolfiMagistratLink';
import { ObservationCard } from '@/components/shared/observations';
import { PriorityBadgeList } from '@/components/shared/priorities/PriorityBadge';
import { TextValue } from '@/components/shared/TextValue';
import { UserAvatarList } from '@/components/shared/user-avatar';
import { labels } from '@/constants/labels.constants';
import { useIsSgNavigation } from '@/hooks/roles.hook';
import { FormattedBirthDate } from '@/i18n/components';
import { useIntlPositionDuration } from '@/i18n/hooks';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MagistratComment } from './magistrat-comment/MagistratComment';
import { MagistratAttachments } from './MagistratAttachments';
import { MagistratSummaryButton } from './MagistratSummaryButton';
import { MemberMemo } from './member-memo/MemberMemo';

export type MagistratDetailsProps = {
  sessionId: string;
  nominationFile: SessionNominationFile;
};

export const MagistratDetails: FC<MagistratDetailsProps> = ({ sessionId, nominationFile }) => {
  const isSg = useIsSgNavigation();
  const {
    dateDeNaissance,
    observants,
    historique,
    grade,
    nomMagistrat,
    posteActuel,
    posteCible,
    rang,
    datePriseDeFonctionPosteActuel,
  } = nominationFile.content;

  const formattedObservers = observants ? formatObservers(observants) : null;
  const formattedBiography = formatBiography(historique);

  const observersCount = (observants?.length ?? 0) + (nominationFile.observations?.length ?? 0);

  const formatDuration = useIntlPositionDuration();
  const positionDuration = datePriseDeFonctionPosteActuel
    ? formatDuration(datePriseDeFonctionPosteActuel)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold">
              {nomMagistrat}
              <LolfiMagistratLink
                small
                name={nomMagistrat}
                sessionId={sessionId}
                nominationFileId={nominationFile.id}
              />
            </span>
            {<UserAvatarList users={nominationFile.reporters} max={2} />}
          </div>
          <MagistratSummaryButton sessionId={sessionId} nominationFile={nominationFile} />
        </div>
        <PriorityBadgeList priorities={nominationFile.priorities} />
      </div>
      <div>
        <TextValue label={labels.magistrat.currentPosition} value={`${posteActuel} - ${grade}`} />
        {positionDuration && <TextValue label={labels.magistrat.dureeDuPoste} value={positionDuration} />}
        <TextValue label={labels.magistrat.targettedPosition} value={posteCible!} />
        <TextValue label={labels.magistrat.rank} value={rang!} />
        <TextValue
          label={labels.magistrat.birthDate}
          value={<FormattedBirthDate value={dateDeNaissance} />}
        />
      </div>
      <div>
        <label className="text-xl font-semibold" id={reportHtmlIds.overview.biography}>
          {labels.magistrat.biography}
        </label>
        <div
          aria-labelledby={reportHtmlIds.overview.biography}
          className="w-full leading-7 whitespace-pre-line"
        >
          {formattedBiography}
        </div>
      </div>

      <MagistratComment
        id={`${nominationFile.id}-comment-input`}
        nominationFileId={nominationFile.id}
        initialComment={nominationFile.comment}
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
                observation={observation}
                sessionId={sessionId}
                nominationFileId={nominationFile.id}
                context={isSg ? 'sg' : 'membre'}
              />
            ))}
          </div>
        )}
        {!formattedObservers && !(nominationFile.observations || []).length && (
          <div className="w-full leading-7 whitespace-pre-line">Aucun</div>
        )}
      </div>

      <MemberMemo sessionId={sessionId} nominationFileId={nominationFile.id} memo={nominationFile.memo} />

      <MagistratAttachments
        nominationFileId={nominationFile.id}
        sessionId={sessionId}
        isArchived={nominationFile.isArchived}
      />
    </div>
  );
};
