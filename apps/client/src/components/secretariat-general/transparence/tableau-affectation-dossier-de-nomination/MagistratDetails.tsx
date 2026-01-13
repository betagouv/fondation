import type { FC } from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import type { FormationEnum } from '@/types/enums.types';
import { ReportVM } from '../../../../VM/ReportVM';
import { AvatarInitials } from '../../../layout/AvatarInitials';
import {
  formatBiography,
  formatBirthDate,
  formatDurationFromDate,
  formatObservers
} from '../../../reports/components/ReportOverview/ReportOverview';
import { reportHtmlIds } from '../../../reports/dom/html-ids';
import { TextValue } from '../../../shared/TextValue';
import { MagistratComment } from './MagistratComment';
import { MemberMemo } from './MemberMemo';

export type MagistratDetailsProps = {
  sessionId: string;
  formation: FormationEnum;
  nominationFile: SessionNominationFile;
};

export const MagistratDetails: FC<MagistratDetailsProps> = ({ sessionId, formation, nominationFile }) => {
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

  const dureeDuPoste = datePriseDeFonctionPosteActuel
    ? formatDurationFromDate(
        new Date(
          datePriseDeFonctionPosteActuel.year,
          datePriseDeFonctionPosteActuel.month - 1,
          datePriseDeFonctionPosteActuel.day
        )
      )
    : null;

  const reportersInitials = nominationFile.reporters.map(({ firstName, lastName }) =>
    [lastName, firstName].map((x) => x.charAt(0).toUpperCase()).join('')
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <label className="text-xl font-semibold">{nomMagistrat}</label>
        {reportersInitials && reportersInitials.length > 0 && (
          <div className="flex items-center gap-2">
            {reportersInitials.map((initials, index) => (
              <AvatarInitials key={index} initials={initials} size="md" />
            ))}
          </div>
        )}
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
          {ReportVM.observersLabel}
        </label>
        <div
          aria-labelledby={reportHtmlIds.overview.biography}
          className="w-full whitespace-pre-line leading-7"
        >
          {formattedObservers ?? 'Aucun'}
        </div>
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

      <MemberMemo sessionId={sessionId} nominationFileId={nominationFile.id} memo={nominationFile.memo} />

      <MagistratComment
        nominationFileId={nominationFile.id}
        initialComment={nominationFile.comment}
        initialCommentAccessUserIds={nominationFile.commentAccessUserIds}
        formation={formation}
      />
    </div>
  );
};
