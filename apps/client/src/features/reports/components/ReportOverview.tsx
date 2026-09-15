import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { FormattedMessage, useIntl } from 'react-intl';
import { Navigate } from 'react-router';

import { ArchiveBannerPortal } from '@/shared/components/banners';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DetailsPageLayout } from '@/shared/ui/details';
import { PageContentLayout } from '@/shared/ui/PageContentLayout';
import type { ReportStatusEnum } from '@/types/enums.types';
import { HttpException } from '@/utils/http-exception';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { TransparencesCurrentPage, useTransparencesBreadCrumb } from '@/utils/transparences-breadcrumb.utils';
import {
  useAttachReportFilesMutation,
  useDetachReportFilesMutation,
  useReportQuery,
  useUpdateReportMutation,
} from '@queries/reports.queries';

import { AttachedFilesList } from './AttachedFilesList';
import { AutoSaveNotice } from './AutoSaveNotice';
import { ReportAlerts } from './ReportAlerts';
import { ReportAttachmentsCard } from './ReportAttachmentsCard';
import { ReportDetailsHeader } from './ReportDetailsHeader';
import { ReportEditor } from './ReportEditor';
import { ReportMagistratCard } from './ReportMagistratCard';
import { ReportNavigation } from './ReportNavigation';

export function ReportOverview({ id }: { id: string }) {
  const { formatMessage } = useIntl();
  const breadCrumbOf = useTransparencesBreadCrumb();

  const { data: retrievedReport, isPending, error } = useReportQuery(id);
  const { mutate: attachReportFiles } = useAttachReportFilesMutation();
  const { mutate: detachReportFiles } = useDetachReportFilesMutation();
  const { mutate: updateReport } = useUpdateReportMutation();

  if (isPending) return null;

  const isForbiddenOrMissing = error instanceof HttpException && [403, 404].includes(error.statusCode);
  if (isForbiddenOrMissing || (!error && !retrievedReport)) {
    return <Navigate replace to={ROUTE_PATHS.TRANSPARENCES.DASHBOARD} />;
  }

  if (error || !retrievedReport) {
    return (
      <PageContentLayout>
        <Alert
          description={<FormattedMessage defaultMessage="Rechargez la page ou réessayez plus tard" />}
          severity="error"
          title={<FormattedMessage defaultMessage="Le rapport n'a pas pu être chargé" />}
        />
      </PageContentLayout>
    );
  }

  const breadcrumb = breadCrumbOf({
    name: TransparencesCurrentPage.gdsReport,
    report: retrievedReport,
  });

  const onUpdateContent = (comment: string) => updateReport({ data: { comment }, reportId: id });
  const onUpdateState = (status: ReportStatusEnum) => updateReport({ data: { status }, reportId: id });

  const onFilesAttached = (files: File[]) => {
    attachReportFiles({
      files,
      reportId: id,
      usage: 'ATTACHMENT',
    });
  };

  const onAttachedFileDeleted = async (fileName: string) => {
    detachReportFiles({
      fileNames: [fileName],
      reportId: id,
    });
  };

  return (
    <ArchiveBannerPortal isArchived={retrievedReport.isArchived}>
      <DetailsPageLayout
        background="cafeCreme"
        header={
          <ReportDetailsHeader
            breadcrumb={
              <Breadcrumb
                ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane du rapport" })}
                breadcrumb={breadcrumb}
                className="fr-my-0"
                id="report-breadcrumb"
              />
            }
            detectedMagistrat={retrievedReport.detectedMagistrat}
            detectedMagistratId={retrievedReport.detectedMagistratId}
            isReadOnly={retrievedReport.isArchived}
            name={retrievedReport.name}
            nominationFileId={retrievedReport.nominationFileId}
            onUpdateState={onUpdateState}
            priorities={retrievedReport.priorities}
            sessionId={retrievedReport.sessionId}
            state={retrievedReport.state}
          />
        }
        identity={<ReportMagistratCard report={retrievedReport} />}
        navigation={<ReportNavigation reportId={id} sessionId={retrievedReport.sessionId} />}
        wideIdentity
      >
        <AutoSaveNotice />
        <ReportAlerts report={retrievedReport} />
        <ReportEditor comment={retrievedReport.comment} onUpdate={onUpdateContent} reportId={id} />
        <ReportAttachmentsCard isReadOnly={retrievedReport.isArchived} onFilesAttached={onFilesAttached}>
          {retrievedReport.attachments.length > 0 && (
            <AttachedFilesList
              attachments={retrievedReport.attachments}
              onDelete={onAttachedFileDeleted}
              reportId={id}
            />
          )}
        </ReportAttachmentsCard>
      </DetailsPageLayout>
    </ArchiveBannerPortal>
  );
}

export default ReportOverview;
