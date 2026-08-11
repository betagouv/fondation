import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useNavigate } from 'react-router';

import { ArchiveBannerPortal } from '@/shared/components/banners';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ScrollToTop } from '@/shared/ui/ScrollToTop';
import type { ReportStatusEnum } from '@/types/enums.types';
import { getTransparencesBreadCrumb, TransparencesCurrentPage } from '@/utils/transparences-breadcrumb.utils';
import {
  useAttachReportFilesMutation,
  useDetachReportFilesMutation,
  useReportQuery,
  useUpdateReportMutation,
} from '@queries/reports.queries';

import { AttachedFileUpload } from './AttachedFileUpload';
import { AutoSaveNotice } from './AutoSaveNotice';
import { Biography } from './Biography';
import { Identity } from './Identity';
import { Observers } from './Observers';
import { ReportAlerts } from './ReportAlerts';
import { ReportEditor } from './ReportEditor';
import { ReportOverviewFileComment } from './ReportOverviewFileComment';
import { ReportOverviewState } from './ReportOverviewState';
import { ReportSummaryCard } from './ReportSummaryCard';
import { Summary } from './Summary';

export function ReportOverview({ id }: { id: string }) {
  const navigate = useNavigate();

  const { data: retrievedReport, isPending, error } = useReportQuery(id);
  const { mutate: attachReportFiles } = useAttachReportFilesMutation();
  const { mutate: detachReportFiles } = useDetachReportFilesMutation();
  const { mutate: updateReport } = useUpdateReportMutation();

  if (isPending || error || !retrievedReport) {
    return null;
  }

  const breadcrumb = getTransparencesBreadCrumb(
    {
      name: TransparencesCurrentPage.gdsReport,
      report: retrievedReport,
    },
    navigate,
  );

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

  if (!retrievedReport)
    return (
      <div>
        <Breadcrumb id="report-breadcrumb" ariaLabel="Fil d'Ariane du rapport" breadcrumb={breadcrumb} />
        Rapport non trouvé.
      </div>
    );

  return (
    <ArchiveBannerPortal isArchived={retrievedReport.isArchived}>
      <div className={clsx('flex-col items-center', cx('fr-grid-row'))}>
        <div className="w-full">
          <Breadcrumb ariaLabel="Fil d'Ariane du rapport" breadcrumb={breadcrumb} id="report-breadcrumb" />
        </div>
        <AutoSaveNotice />
        <div className={clsx('scroll-smooth', cx('fr-grid-row', 'fr-grid-row--center', 'fr-py-12v'))}>
          <div className={clsx('hidden md:block', cx('fr-col-md-5', 'fr-col-lg-4', 'fr-col-xl-3'))}>
            <Summary
              fileComment={retrievedReport.fileComment}
              observers={retrievedReport.observers.concat(retrievedReport.observations.map(({ id }) => id))}
              summary={retrievedReport.summary}
            />
          </div>
          <div
            className={clsx('flex-col gap-2', cx('fr-grid-row', 'fr-col-md-7', 'fr-col-lg-8', 'fr-col-xl-9'))}
          >
            <ReportAlerts report={retrievedReport} />
            <ReportOverviewState onUpdateState={onUpdateState} state={retrievedReport.state} />
            <Identity
              birthDate={retrievedReport.birthDate}
              currentPosition={retrievedReport.currentPosition}
              detectedMagistratId={retrievedReport.detectedMagistratId}
              dureeDuPoste={retrievedReport.dureeDuPoste}
              grade={retrievedReport.grade}
              name={retrievedReport.name}
              nominationFileId={retrievedReport.nominationFileId}
              priorities={retrievedReport.priorities}
              rank={retrievedReport.rank}
              sessionId={retrievedReport.sessionId}
              targetedGrade={retrievedReport.targetedGrade}
              targettedPosition={retrievedReport.targettedPosition}
            />
            <Biography biography={retrievedReport.biography} />
            <ReportOverviewFileComment report={retrievedReport} />
            <ReportSummaryCard
              nominationFileId={retrievedReport.nominationFileId}
              sessionId={retrievedReport.sessionId}
              summary={retrievedReport.summary}
            />
            <ReportEditor comment={retrievedReport.comment} onUpdate={onUpdateContent} reportId={id} />
            <Observers
              nominationFileId={retrievedReport.nominationFileId}
              observations={retrievedReport.observations}
              observers={retrievedReport.observers}
              reportId={id}
              sessionId={retrievedReport.sessionId}
            />
            <AttachedFileUpload
              attachments={retrievedReport.attachments}
              onAttachedFileDeleted={onAttachedFileDeleted}
              onFilesAttached={onFilesAttached}
              reportId={id}
            />
          </div>
        </div>
        <ScrollToTop />
      </div>
    </ArchiveBannerPortal>
  );
}

export default ReportOverview;
