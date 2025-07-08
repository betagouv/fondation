import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

import { allRulesMapV2, type DateOnlyJson } from 'shared-models';
import { DateOnly } from '../../../../models/date-only.model';
import { type ReportSM } from '../../../../queries/list-reports.queries';
import {
  getTransparencesBreadCrumb,
  TransparencesCurrentPage
} from '../../../../utils/transparences-breadcrumb.utils';
import { Breadcrumb } from '../../../shared/Breadcrumb';
import { AttachedFileUpload } from './AttachedFileUpload';
import { AutoSaveNotice } from './AutoSaveNotice';
import { Biography } from './Biography';
import { MagistratIdentity } from './MagistratIdentity';
import { Observers } from './Observers';
import { ReportEditor } from './ReportEditor';

import { ReportRules } from './ReportRules';
import { useReportById } from '../../../../queries/report-by-id.queries';
import { allRulesLabelsMap } from '../../labels/rules-labels';
import { ReportVMRulesBuilder } from '../../../../Builders/ReportVMRules.builder';
import { Summary } from './Summary';
import { ReportOverviewState } from './ReportOverviewState';
// import { Summary } from './Summary';

const formatBiography = (biography: string | null) => {
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

const formatObservers = (observers: ReportSM['observers']) =>
  observers?.map((observer) => observer.split('\n') as [string, ...string[]]) ||
  null;

const formatBirthDate = (birthDateJson: DateOnlyJson, currentDate: Date) => {
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

  const { report, isLoading, error } = useReportById(id);

  const retrievedReport = report as ReportSM;
  if (isLoading || error) {
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
  const formattedBirthDate = formatBirthDate(
    retrievedReport.birthDate,
    new Date()
  );
  const formattedObservers = formatObservers(retrievedReport.observers);
  const formattedBiography = formatBiography(retrievedReport.biography);

  // const report = useAppSelector((state) => selectReport(state, id));

  // const isFetching = useAppSelector((state) =>
  //   selectFetchingReport(state, {
  //     reportId: id
  //   })
  // );
  // const dispatch = useAppDispatch();

  // const onUpdateReport = <T extends keyof UpdateReportParams['data']>(data: {
  //   [key in keyof UpdateReportParams['data']]: T extends key
  //     ? UpdateReportParams['data'][key]
  //     : undefined;
  // }) => {
  //   dispatch(
  //     updateReport({
  //       reportId: id,
  //       data
  //     })
  //   );
  // };

  // const onUpdateContent = (comment: string) => {
  //   return onUpdateReport<'comment'>({ comment });
  // };
  // const onUpdateState = (state: ReportStateUpdateParam) => {
  //   return onUpdateReport<'state'>({ state });
  // };

  // const onUpdateReportRule =
  //   (ruleGroup: NominationFile.RuleGroup, ruleName: NominationFile.RuleName) =>
  //   () => {
  //     if (!report) return;

  //     const rule = {
  //       ...report.rulesChecked[ruleGroup].selected,
  //       ...report.rulesChecked[ruleGroup].others
  //     } as Record<NominationFile.RuleName, VMReportRuleValue>;
  //     dispatch(
  //       updateReportRule({
  //         reportId: id,
  //         ruleId: rule[ruleName].id,
  //         validated: rule[ruleName].checked
  //       })
  //     );
  //   };

  // const onFilesAttached = (files: File[]) => {
  //   dispatch(
  //     attachReportFiles({
  //       reportId: id,
  //       files
  //     })
  //   );
  // };

  // const onAttachedFileDeleted = (fileName: string) => {
  //   dispatch(
  //     deleteReportFile({
  //       reportId: id,
  //       fileName
  //     })
  //   );
  // };

  // useEffect(() => {
  //   dispatch(retrieveReport(id));
  // }, [dispatch, id]);

  // if (!report)
  //   return isFetching ? null : (
  //     <div>
  //       <Breadcrumb
  //         id="report-breadcrumb"
  //         ariaLabel="Fil d'Ariane du rapport"
  //         breadcrumb={breadcrumb}
  //       />
  //       Rapport non trouvé.
  //     </div>
  //   );

  return (
    <div className={clsx('flex-col items-center', cx('fr-grid-row'))}>
      <div className="w-full">
        <Breadcrumb
          id="report-breadcrumb"
          ariaLabel="Fil d'Ariane du rapport"
          breadcrumb={breadcrumb}
        />
      </div>
      <AutoSaveNotice />
      <div
        className={clsx(
          'scroll-smooth',
          cx('fr-grid-row', 'fr-grid-row--center', 'fr-py-12v')
        )}
      >
        <div
          className={clsx(
            'hidden md:block',
            cx('fr-col-md-5', 'fr-col-lg-4', 'fr-col-xl-3')
          )}
        >
          <Summary observers={retrievedReport.observers} />
        </div>
        <div
          className={clsx(
            'flex-col gap-2',
            cx('fr-grid-row', 'fr-col-md-7', 'fr-col-lg-8', 'fr-col-xl-9')
          )}
        >
          <ReportOverviewState
            state={retrievedReport.state}
            onUpdateState={() => {}}
          />
          <MagistratIdentity
            name={retrievedReport.name}
            birthDate={formattedBirthDate}
            grade={retrievedReport.grade}
            currentPosition={retrievedReport.currentPosition}
            targettedPosition={retrievedReport.targettedPosition}
            rank={retrievedReport.rank}
            dureeDuPoste={retrievedReport.dureeDuPoste}
          />
          <Biography biography={formattedBiography} />
          <ReportEditor
            comment={retrievedReport.comment}
            onUpdate={() => {}}
            reportId={id}
          />
          <Observers observers={formattedObservers} />
          <ReportRules
            rulesChecked={rulesChecked}
            onUpdateReportRule={() => {}}
            reportId={id}
          />
          <AttachedFileUpload
            attachedFiles={retrievedReport.attachedFiles}
            onFilesAttached={() => {}}
            onAttachedFileDeleted={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportOverview;
