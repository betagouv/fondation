import { Input } from '@codegouvfr/react-dsfr/Input';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Magistrat, Role } from 'shared-models';
import { useDebounce } from 'use-debounce';
import { useUpdateCommentAccessMutation } from '../../../../react-query/mutations/sg/comment-access.mutations';
import type { SessionNominationFile } from '../../../../react-query/mutations/sg/nomination-session-affectations';
import { useUpdateNominationFileCommentMutation } from '../../../../react-query/mutations/sg/update-nomination-file-comment';
import { useGetReportsByDnId } from '../../../../react-query/queries/sg/get-reports-by-dn-id.query';
import { useGetUsersByFormation } from '../../../../react-query/queries/sg/get-users-by-formation.query';
import { useValidateSessionFromCookie } from '../../../../react-query/queries/validate-session-from-cookie.query';
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
import { UserChipsSelect } from '../../../shared/UserChipsSelect';

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
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useValidateSessionFromCookie();
  const isSG = user?.role === Role.ADJOINT_SECRETAIRE_GENERAL;

  const [comment, setComment] = useState(initialComment || '');
  const [debouncedComment] = useDebounce(comment, 1000);
  const { mutate: updateComment } = useUpdateNominationFileCommentMutation();

  const [selectedAccessUserIds, setSelectedAccessUserIds] = useState<string[]>(
    initialCommentAccessUserIds || []
  );
  const { mutate: updateCommentAccess } = useUpdateCommentAccessMutation();

  const { data: eligibleUsers } = useGetUsersByFormation(formation);

  const { data: reports, isLoading, error } = useGetReportsByDnId(idDn);

  useEffect(() => {
    if (isSG && debouncedComment !== initialComment && sessionId) {
      updateComment({ sessionId, nominationFileId: idDn, comment: debouncedComment || null });
    }
  }, [debouncedComment, initialComment, idDn, updateComment, sessionId, isSG]);

  const handleAccessChange = (newSelectedUserIds: string[]) => {
    setSelectedAccessUserIds(newSelectedUserIds);
    if (sessionId) {
      updateCommentAccess({
        sessionId,
        nominationFileId: idDn,
        userIds: newSelectedUserIds
      });
    }
  };

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

  const showComment = isSG || initialComment !== null;

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

      {showComment && (
        <div>
          {isSG ? (
            <>
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
              <p className="mt-1 text-sm text-gray-500">{comment.length} / 50 000 caractères</p>

              <div className="mt-4">
                <UserChipsSelect
                  availableUsers={eligibleUsers || []}
                  selectedUserIds={selectedAccessUserIds}
                  onSelectionChange={handleAccessChange}
                  placeholder="Rechercher un utilisateur..."
                  label="Partager ce commentaire avec"
                />
              </div>
            </>
          ) : (
            <>
              <label className="text-xl font-semibold">Commentaire</label>
              <div className="mt-2 whitespace-pre-line rounded border border-gray-300 bg-gray-50 p-4">
                {initialComment || 'Aucun commentaire'}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
