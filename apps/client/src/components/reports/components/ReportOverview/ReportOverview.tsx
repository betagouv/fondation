import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

import type { DetailedReportDto } from '@api/types';
import { useReportById } from '@queries/reports.queries';

import { allRulesMapV2, NominationFile, ReportFileUsage, type DateOnlyJson } from 'shared-models';
import { DateOnly } from '../../../../models/date-only.model';
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

import { ReportVMRulesBuilder } from '../../../../Builders/ReportVMRules.builder';
import type { VMReportRuleValue } from '../../../../VM/ReportVM';
import { useAttachReportFiles } from '@queries/reports.queries';
import { allRulesLabelsMap } from '../../labels/rules-labels';
import { ReportOverviewState } from './ReportOverviewState';
import { ReportRules } from './ReportRules';
import { Summary } from './Summary';

import { useUpdateReportRuleValidation } from '@queries/reports.queries';
import { useUpdateReport } from '@queries/reports.queries';
import { useDetachReportFiles } from '@queries/reports.queries';

export const formatBiography = (biography: string | null) => {
  if (!biography) return null;
  if (biography.indexOf('- ') === -1) return biography;

  const biographyElements = biography
    .trim()
    .split('- ')
    .map((part) => part.trim());
  // we skipt the real first element because it is empty
  const [, firstElement, ...otherElements] = biographyElements;
  return `- ${firstElement}\n- ${otherElements.join('\n- ')}`;
};

export const formatObservers = (observers: DetailedReportDto['observers']) => {
  if (!observers || observers.length === 0) {
    return null;
  }
  return observers?.map((observer) => observer.split('\n') as [string, ...string[]]);
};

export const formatDurationFromDate = (startDate: Date, endDate: Date = new Date()): string => {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();

  const months = (endYear - startYear) * 12 + (endMonth - startMonth);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} mois`;
  }

  if (remainingMonths === 0) {
    return `${years} an${years > 1 ? 's' : ''}`;
  }

  return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
};

export const formatBirthDate = (birthDateJson: DateOnlyJson, currentDate: Date) => {
  const birthDate = DateOnly.fromStoreModel(birthDateJson);
  const today = DateOnly.fromDate(currentDate);
  const age = birthDate.getAge(today);
  return `${birthDate.toFormattedString()} (${age} ans)`;
};

export type ReportOverviewProps = {
  id: string;
};

export const ReportOverview: React.FC<ReportOverviewProps> = ({ id }) => {
  const navigate = useNavigate();

  const { data: retrievedReport, isPending, error, refetch } = useReportById(id);
  const { mutate: updateRule } = useUpdateReportRuleValidation();
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

  const rulesChecked = ReportVMRulesBuilder.buildFromStoreModel(
    retrievedReport.rules,
    allRulesMapV2,
    allRulesLabelsMap
  );
  const formattedBirthDate = formatBirthDate(retrievedReport.birthDate!, new Date());
  const formattedObservers = formatObservers(retrievedReport.observers);
  const formattedBiography = formatBiography(retrievedReport.biography);

  const onUpdateContent = (comment: string) => updateReport({ reportId: id, data: { comment } });
  const onUpdateState = (status: NominationFile.ReportState) =>
    updateReport({ reportId: id, data: { status } }, onSuccess);

  const onUpdateReportRule =
    (ruleGroup: NominationFile.RuleGroup, ruleName: NominationFile.RuleName) => () => {
      if (!retrievedReport) return;

      const rule = {
        ...rulesChecked[ruleGroup].selected,
        ...rulesChecked[ruleGroup].others
      } as Record<NominationFile.RuleName, VMReportRuleValue>;

      updateRule(
        {
          reportId: id,
          ruleId: rule[ruleName].id,
          isValidated: !rule[ruleName].checked
        },
        onSuccess
      );
    };

  const onFilesAttached = (files: File[]) => {
    attachReportFiles(
      {
        reportId: id,
        files,
        usage: ReportFileUsage.ATTACHMENT
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
          <Summary observers={retrievedReport.observers} />
        </div>
        <div
          className={clsx('flex-col gap-2', cx('fr-grid-row', 'fr-col-md-7', 'fr-col-lg-8', 'fr-col-xl-9'))}
        >
          <ReportOverviewState state={retrievedReport.state} onUpdateState={onUpdateState} />
          <MagistratIdentity
            name={retrievedReport.name}
            birthDate={formattedBirthDate}
            grade={retrievedReport.grade}
            currentPosition={retrievedReport.currentPosition!}
            targettedPosition={retrievedReport.targettedPosition!}
            rank={retrievedReport.rank!}
            dureeDuPoste={retrievedReport.dureeDuPoste}
          />
          <Biography biography={formattedBiography} />
          <ReportEditor comment={retrievedReport.comment} onUpdate={onUpdateContent} reportId={id} />
          <Observers observers={formattedObservers} />
          <ReportRules
            rulesChecked={rulesChecked}
            rules={retrievedReport?.rules}
            onUpdateReportRule={onUpdateReportRule}
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
