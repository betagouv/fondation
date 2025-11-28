import type { FC } from 'react';
import { useEffect, useState } from 'react';
import {
  formatBiography,
  formatBirthDate,
  formatDurationFromDate,
  formatObservers
} from '../../../reports/components/ReportOverview/ReportOverview';
import { TextValue } from '../../../shared/TextValue';
import { ReportVM } from '../../../../VM/ReportVM';
import { reportHtmlIds } from '../../../reports/dom/html-ids';
import { useGetReportsByDnId } from '../../../../react-query/queries/sg/get-reports-by-dn-id.query';
import { ErrorMessage } from '../../../shared/ErrorMessage';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { AvatarInitials } from '../../../layout/AvatarInitials';
import type { SessionNominationFile } from '../../../../react-query/mutations/sg/nomination-session-affectations';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { useDebouncedValue } from 'use-debounce';
import { useUpdateNominationFileCommentMutation } from '../../../../react-query/mutations/sg/update-nomination-file-comment';
import { useParams } from 'react-router-dom';

export type MagistratDetailsProps = {
  content: SessionNominationFile['content'];
  idDn: string;
  comment?: string | null;
};

export const MagistratDetails: FC<MagistratDetailsProps> = ({ content, idDn, comment: initialComment }) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [comment, setComment] = useState(initialComment || '');
  const [debouncedComment] = useDebouncedValue(comment, 1000);
  const { mutate } = useUpdateNominationFileCommentMutation();

  useEffect(() => {
    if (debouncedComment !== initialComment && sessionId) {
      mutate({ sessionId, nominationFileId: idDn, comment: debouncedComment || null });
    }
  }, [debouncedComment, initialComment, idDn, mutate, sessionId]);
  // Créer une référence à la modale pour détecter son état
  const modalRef = { id: `modal-magistrat-dn-details-${idDn}`, isOpenedByDefault: false };
  const isModalOpen = useIsModalOpen(modalRef);

  const {
    data: reports,
    isLoading,
    error
  } = useGetReportsByDnId(idDn, {
    enabled: isModalOpen
  });

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

      <div>
        <Input
          label="Commentaire"
          textArea
          nativeTextAreaProps={{
            value: comment,
            onChange: (e) => setComment(e.target.value),
            maxLength: 50000,
            rows: 6,
            placeholder: 'Saisissez un commentaire...'
          }}
        />
        <p className="text-sm text-gray-500 mt-1">
          {comment.length} / 50 000 caractères
        </p>
      </div>
    </div>
  );
};
