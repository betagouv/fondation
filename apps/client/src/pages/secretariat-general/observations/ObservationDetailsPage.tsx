import { Navigate, useParams, useLocation } from 'react-router-dom';
import React from 'react';

import {
  useObservationDetailsQuery,
  useGetObservationFileUrlMutation,
  useWriteObservationMemberCommentMutation,
  useAttachObservationMemberCommentScreenshotsMutation
} from '@queries/observations.queries';
import { PageContentLayout } from '../../../components/shared/PageContentLayout';
import { ObservationDetailsContent } from '../../../components/shared/ObservationDetailsContent';
import { getDetailSessionGdsPath } from '../../../utils/route-path.utils';
import type { FilesUploader } from '@/components/reports/components/ReportOverview/TipTapEditor/extensions/editor-file-uploader';
import { ObservationFollowUpCommentProvider } from '@/components/shared/observations/follow-up-selector/ObservationFollowUpCommentDialogProvider';

export function ObservationDetailsPage() {
  const { sessionId, nominationFileId, observationId } = useParams<{
    sessionId: string;
    nominationFileId: string;
    observationId: string;
  }>();

  const location = useLocation();
  const isSgContext = location.pathname.startsWith('/secretariat-general');
  const context = isSgContext ? 'sg' : 'membre';

  const {
    data: observation,
    isLoading,
    isError
  } = useObservationDetailsQuery({
    sessionId: sessionId ?? '',
    nominationFileId: nominationFileId ?? '',
    observationId: observationId ?? ''
  });

  const { mutate: getFileUrl } = useGetObservationFileUrlMutation();
  const { mutate: writeMemberComment } = useWriteObservationMemberCommentMutation();
  const { mutateAsync: attachFiles } = useAttachObservationMemberCommentScreenshotsMutation();

  const uploadFiles = React.useCallback<FilesUploader>(
    async (files: readonly File[]) => {
      const result = await attachFiles({
        sessionId: sessionId ?? '',
        nominationFileId: nominationFileId ?? '',
        observationId: observationId ?? '',
        files: files as File[]
      });
      return (result?.items ?? []).map(({ id, name, url }) => ({
        id,
        name,
        url: new URL(url)
      }));
    },
    [attachFiles, sessionId, nominationFileId, observationId]
  );

  if (isLoading) {
    return (
      <PageContentLayout fullBackgroundGreen={true}>
        <p>Chargement...</p>
      </PageContentLayout>
    );
  }

  const fallbackPath = isSgContext
    ? `/secretariat-general/session/${sessionId}`
    : getDetailSessionGdsPath({ sessionId: sessionId ?? '' });

  if (!observationId || !sessionId || !nominationFileId || isError || !observation) {
    return <Navigate replace={true} to={fallbackPath} />;
  }

  const handleDownloadFile = (fileId: string) => {
    getFileUrl(
      { sessionId, nominationFileId, observationId, fileId },
      { onSuccess: (url) => window.open(url, '_blank') }
    );
  };

  const handleUpdateMemberComment = (comment: string) => {
    writeMemberComment({
      sessionId,
      nominationFileId,
      observationId,
      comment
    });
  };

  const backLink = isSgContext
    ? { to: `/secretariat-general/session/${sessionId}`, label: 'Retour à la session' }
    : { to: getDetailSessionGdsPath({ sessionId }), label: 'Retour à la session' };

  return (
    <PageContentLayout fullBackgroundGreen={true}>
      <ObservationFollowUpCommentProvider>
        <ObservationDetailsContent
          sessionId={sessionId}
          nominationFileId={nominationFileId}
          observationId={observationId}
          observation={observation}
          onDownloadFile={handleDownloadFile}
          backLink={backLink}
          context={context}
          onUpdateMemberComment={handleUpdateMemberComment}
          uploadFiles={uploadFiles}
        />
      </ObservationFollowUpCommentProvider>
    </PageContentLayout>
  );
}
