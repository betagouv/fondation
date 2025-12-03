import type { FC } from 'react';
import { Magistrat } from 'shared-models';
import type { SessionNominationFile } from '../../../../react-query/mutations/sg/nomination-session-affectations';
import { useGetReportsByDnId } from '../../../../react-query/queries/sg/get-reports-by-dn-id.query';
import { ReportVM } from '../../../../VM/ReportVM';
import { AvatarInitials } from '../../../layout/AvatarInitials';
import {
  formatBiography,
  formatBirthDate,
  formatDurationFromDate,
  formatObservers
} from '../../../reports/components/ReportOverview/ReportOverview';
import { reportHtmlIds } from '../../../reports/dom/html-ids';
import { ErrorMessage } from '../../../shared/ErrorMessage';
import { TextValue } from '../../../shared/TextValue';
import { MagistratComment } from './MagistratComment';

export type MagistratDetailsProps = {
  content: SessionNominationFile['content'];
  idDn: string;
  comment?: string | null;
  commentAccessUserIds?: string[];
  formation: Magistrat.Formation;
};

export const MagistratDetails: FC<MagistratDetailsProps> = ({
  content,
  idDn,
  comment: initialComment,
  commentAccessUserIds: initialCommentAccessUserIds,
  formation
}) => {
  const { data: reports, isLoading, error } = useGetReportsByDnId(idDn);

  if (isLoading) {
    return <div>Chargement des rapports...</div>;
  }

  if (error) {
    return <ErrorMessage message="Erreur lors du chargement des rapports" />;
  }

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
  } = content;

  const formattedBirthDate = formatBirthDate(dateDeNaissance, new Date());
  const formattedObservers = formatObservers(observants);
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

  const reportersInitials = reports?.map((report) =>
    report.name
      .split(' ')
      .map((name) => name[0])
      .join('')
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
        <TextValue label={ReportVM.magistratIdentityLabels.targettedPosition} value={posteCible} />
        <TextValue label={ReportVM.magistratIdentityLabels.rank} value={rang} />
        <TextValue label={ReportVM.magistratIdentityLabels.birthDate} value={formattedBirthDate} />
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

      <MagistratComment
        nominationFileId={idDn}
        initialComment={initialComment}
        initialCommentAccessUserIds={initialCommentAccessUserIds}
        formation={formation}
      />
    </div>
  );
};
