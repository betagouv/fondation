import type { FC } from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { ReportVM } from '@/VM/ReportVM';
import { reportHtmlIds } from '@/components/reports/dom/html-ids';
import { useIsSgNavigation } from '@/hooks/roles.hook';

import {
  formatBiography,
  formatBirthDate,
  formatDurationFromDate,
  formatObservers
} from '@/components/reports/components/ReportOverview/ReportOverview';

import { LolfiMagistratLink } from '@/components/shared/LolfiMagistratLink';
import { TextValue } from '@/components/shared/TextValue';
import { ObservationCard } from '@/components/shared/observations';
import { UserAvatarList } from '@/components/shared/user-avatar';

import clsx from 'clsx';

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
    datePriseDeFonctionPosteActuel
  } = nominationFile.content;

  const formattedBirthDate = dateDeNaissance ? formatBirthDate(dateDeNaissance, new Date()) : null;
  const formattedObservers = observants ? formatObservers(observants) : null;
  const formattedBiography = formatBiography(historique);

  const observersCount = (observants?.length ?? 0) + (nominationFile.observations?.length ?? 0);

  const dureeDuPoste = datePriseDeFonctionPosteActuel
    ? formatDurationFromDate(
        new Date(
          datePriseDeFonctionPosteActuel.year,
          datePriseDeFonctionPosteActuel.month - 1,
          datePriseDeFonctionPosteActuel.day
        )
      )
    : null;

  return (
    <div className="flex flex-col gap-4">
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
      <div>
        <TextValue
          label={ReportVM.magistratIdentityLabels.currentPosition}
          value={`${posteActuel} - ${grade}`}
        />
        {dureeDuPoste && (
          <TextValue label={ReportVM.magistratIdentityLabels.dureeDuPoste} value={dureeDuPoste} />
        )}
        <TextValue label={ReportVM.magistratIdentityLabels.targettedPosition} value={posteCible!} />
        <TextValue label={ReportVM.magistratIdentityLabels.rank} value={rang!} />
        <TextValue label={ReportVM.magistratIdentityLabels.birthDate} value={formattedBirthDate!} />
      </div>
      <div>
        <label className="text-xl font-semibold" id={reportHtmlIds.overview.biography}>
          {ReportVM.biographyLabel}
        </label>
        <div
          aria-labelledby={reportHtmlIds.overview.biography}
          className="w-full whitespace-pre-line leading-7"
        >
          {formattedBiography}
        </div>
      </div>

      <div>
        <label className="text-xl font-semibold">
          Observants{observersCount > 0 ? ` (${observersCount})` : null}
        </label>
        {formattedObservers && (
          <div className="w-full whitespace-pre-line leading-7">{formattedObservers}</div>
        )}
        {nominationFile.observations && nominationFile.observations.length > 0 && (
          <div className={clsx('grid grid-cols-1 gap-4 md:grid-cols-2', 'mt-2')}>
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
          <div className="w-full whitespace-pre-line leading-7">Aucun</div>
        )}
      </div>

      <MemberMemo sessionId={sessionId} nominationFileId={nominationFile.id} memo={nominationFile.memo} />
    </div>
  );
};
