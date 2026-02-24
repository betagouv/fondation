import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useNavigate } from 'react-router';

import { useReportById } from '@queries/reports.queries';

import { NominationFile } from 'shared-models';
import {
  getTransparencesBreadCrumb,
  TransparencesCurrentPage
} from '../../../../utils/transparences-breadcrumb.utils';
import { Breadcrumb } from '../../../shared/Breadcrumb';
import { ScrollToTop } from '../../../shared/ScrollToTop';
import { AttachedFileUpload } from './AttachedFileUpload';
import { AutoSaveNotice } from './AutoSaveNotice';
import { Biography } from './Biography';
import { MagistratIdentity } from './MagistratIdentity';
import { Observers } from './Observers';
import { ReportEditor } from './ReportEditor';

import { useAttachReportFiles } from '@queries/reports.queries';
import { ReportOverviewState } from './ReportOverviewState';
import { Summary } from './Summary';

import { useDetachReportFiles, useUpdateReport } from '@queries/reports.queries';
import { ReportOverviewFileComment } from './ReportOverviewFileComment';
import { ReportSummaryCard } from './ReportSummaryCard';
import { formatBiography, formatObservers } from './formatters';

export type ReportOverviewProps = {
  id: string;
};

export const ReportOverview: React.FC<ReportOverviewProps> = ({ id }) => {
  const navigate = useNavigate();

  const { data: retrievedReport, isPending, error, refetch } = useReportById(id);
  const { mutate: attachReportFiles } = useAttachReportFiles();
  const { mutate: detachReportFiles } = useDetachReportFiles();
  const { mutate: updateReport } = useUpdateReport();

  const onSuccess = {
    onSuccess: () => {
      refetch();
    }
  };

  if (isPending || error || !retrievedReport) {
    return null;
  }

  const breadcrumb = getTransparencesBreadCrumb(
    {
      name: TransparencesCurrentPage.gdsReport,
      report: retrievedReport
    },
    navigate
  );

  const formattedObservers = formatObservers(retrievedReport.observers);
  const formattedBiography = formatBiography(retrievedReport.biography);

  const onUpdateContent = (comment: string) => updateReport({ reportId: id, data: { comment } });
  const onUpdateState = (status: NominationFile.ReportState) =>
    updateReport({ reportId: id, data: { status } }, onSuccess);

  const onFilesAttached = (files: File[]) => {
    attachReportFiles(
      {
        reportId: id,
        files,
        usage: 'ATTACHMENT'
      },
      onSuccess
    );
  };

  const onAttachedFileDeleted = async (fileName: string) => {
    detachReportFiles(
      {
        reportId: id,
        fileNames: [fileName]
      },
      onSuccess
    );
  };

  if (!retrievedReport)
    return isPending ? null : (
      <div>
        <Breadcrumb id="report-breadcrumb" ariaLabel="Fil d'Ariane du rapport" breadcrumb={breadcrumb} />
        Rapport non trouvé.
      </div>
    );

  return (
    <div className={clsx('flex-col items-center', cx('fr-grid-row'))}>
      <div className="w-full">
        <Breadcrumb id="report-breadcrumb" ariaLabel="Fil d'Ariane du rapport" breadcrumb={breadcrumb} />
      </div>
      <AutoSaveNotice />
      <div className={clsx('scroll-smooth', cx('fr-grid-row', 'fr-grid-row--center', 'fr-py-12v'))}>
        <div className={clsx('hidden md:block', cx('fr-col-md-5', 'fr-col-lg-4', 'fr-col-xl-3'))}>
          <Summary
            summary={retrievedReport.summary}
            fileComment={retrievedReport.fileComment}
            observers={retrievedReport.observers.concat(retrievedReport.observations.map(({ id }) => id))}
          />
        </div>
        <div
          className={clsx('flex-col gap-2', cx('fr-grid-row', 'fr-col-md-7', 'fr-col-lg-8', 'fr-col-xl-9'))}
        >
          <ReportOverviewState state={retrievedReport.state} onUpdateState={onUpdateState} />
          <MagistratIdentity
            name={retrievedReport.name}
            birthDate={retrievedReport.birthDate}
            grade={retrievedReport.grade}
            currentPosition={retrievedReport.currentPosition!}
            targettedPosition={retrievedReport.targettedPosition!}
            rank={retrievedReport.rank!}
            dureeDuPoste={retrievedReport.dureeDuPoste}
            priority={retrievedReport.priority}
            sessionId={retrievedReport.sessionId}
            nominationFileId={retrievedReport.nominationFileId}
          />
          <Biography biography={formattedBiography} />
          <ReportOverviewFileComment report={retrievedReport} />
          <ReportSummaryCard
            summary={retrievedReport.summary}
            sessionId={retrievedReport.sessionId}
            nominationFileId={retrievedReport.nominationFileId}
          />
          <ReportEditor comment={retrievedReport.comment} onUpdate={onUpdateContent} reportId={id} />
          <Observers
            observers={formattedObservers}
            observations={retrievedReport.observations}
            sessionId={retrievedReport.sessionId}
            nominationFileId={retrievedReport.nominationFileId}
            reportId={id}
          />
          <AttachedFileUpload
            reportId={id}
            attachments={retrievedReport.attachments}
            onFilesAttached={onFilesAttached}
            onAttachedFileDeleted={onAttachedFileDeleted}
          />
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
};

export default ReportOverview;
