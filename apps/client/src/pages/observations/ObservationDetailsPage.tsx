import { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, useParams, useSearchParams } from 'react-router';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { ObservationDetailsContent } from '@/features/observations/components/ObservationDetailsContent';
import { ObservationFollowUpCommentProvider } from '@/features/observations/context/ObservationFollowUpCommentDialogProvider';
import { ArchiveBannerPortal } from '@/shared/components/banners';
import { useScrollToTop } from '@/shared/hooks/useScrollToTop';
import { PageContentLayout } from '@/shared/ui/PageContentLayout';
import type { FilesUploader } from '@/shared/ui/tip-tap-editor';
import { getDetailSessionGdsPath, openedDossierSearch, ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDownloadFileMutation } from '@queries/files.queries';
import {
  useAttachObservationMemberCommentScreenshotsMutation,
  useGetObservationFileUrlMutation,
  useObservationDetailsQuery,
  useWriteObservationMemberCommentMutation,
} from '@queries/observations.queries';

export function ObservationDetailsPage() {
  const { nominationFileId, observationId, sessionId } = useParams<{
    nominationFileId: string;
    observationId: string;
    sessionId: string;
  }>();

  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('reportId');

  const isSgContext = useIsSgNavigation();
  const context = isSgContext ? 'sg' : 'membre';

  const {
    data: observation,
    isError,
    isLoading,
  } = useObservationDetailsQuery({
    nominationFileId: nominationFileId ?? '',
    observationId: observationId ?? '',
    sessionId: sessionId ?? '',
  });

  const { mutate: download } = useDownloadFileMutation();
  const { mutate: getFileUrl } = useGetObservationFileUrlMutation();
  const { mutate: writeMemberComment } = useWriteObservationMemberCommentMutation();
  const { mutateAsync: attachFiles } = useAttachObservationMemberCommentScreenshotsMutation();

  const uploadFiles = useCallback<FilesUploader>(
    async (files: readonly File[]) => {
      const result = await attachFiles({
        files: files as File[],
        nominationFileId: nominationFileId ?? '',
        observationId: observationId ?? '',
        sessionId: sessionId ?? '',
      });
      return (result?.items ?? []).map(({ id, name, url }) => ({
        id,
        name,
        url: new URL(url),
      }));
    },
    [attachFiles, sessionId, nominationFileId, observationId],
  );

  useScrollToTop(observationId);

  if (isLoading) {
    return (
      <PageContentLayout fullBackgroundGreen={true}>
        <p>
          <FormattedMessage defaultMessage="Chargement..." />
        </p>
      </PageContentLayout>
    );
  }

  const fallbackPath = isSgContext
    ? `/secretariat-general/session/${sessionId}`
    : getDetailSessionGdsPath({ sessionId: sessionId ?? '' });

  if (!observationId || !sessionId || !nominationFileId || isError || !observation) {
    return <Navigate replace={true} to={fallbackPath} />;
  }

  const handleOpenFile = (fileId: string) => {
    getFileUrl(
      { fileId, nominationFileId, observationId, sessionId },
      { onSuccess: (url) => window.open(url, '_blank') },
    );
  };

  const handleDownloadFile = (file: { id: string; name: string }) => {
    getFileUrl(
      { fileId: file.id, nominationFileId, observationId, sessionId },
      { onSuccess: (url) => download({ name: file.name, url }) },
    );
  };

  const handleUpdateMemberComment = (comment: string) => {
    writeMemberComment({
      comment,
      nominationFileId,
      observationId,
      sessionId,
    });
  };

  const openedSidePanel = openedDossierSearch(nominationFileId);

  const backTo = isSgContext
    ? `/secretariat-general/session/${sessionId}${openedSidePanel}`
    : reportId
      ? ROUTE_PATHS.TRANSPARENCES.DETAILS_REPORTS.replace(':id', reportId)
      : `${getDetailSessionGdsPath({ sessionId })}${openedSidePanel}`;

  return (
    <ArchiveBannerPortal isArchived={observation.isArchived}>
      <ObservationFollowUpCommentProvider>
        <ObservationDetailsContent
          backTo={backTo}
          context={context}
          isArchived={observation.isArchived}
          nominationFileId={nominationFileId}
          observation={observation}
          observationId={observationId}
          onDownloadFile={handleDownloadFile}
          onOpenFile={handleOpenFile}
          onUpdateMemberComment={handleUpdateMemberComment}
          sessionId={sessionId}
          uploadFiles={uploadFiles}
        />
      </ObservationFollowUpCommentProvider>
    </ArchiveBannerPortal>
  );
}
