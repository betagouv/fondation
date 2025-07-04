import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

import { type DateOnlyJson } from 'shared-models';
import { DateOnly } from '../../../../models/date-only.model';
import { type ReportSM } from '../../../../queries/list-reports.query';
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
import { ReportOverviewState } from './ReportOverviewState';
import { ReportRules } from './ReportRules';
import { Summary } from './Summary';

const formatBiography = (biography: string) => {
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
  const breadcrumb = getTransparencesBreadCrumb(
    {
      name: TransparencesCurrentPage.gdsReport
    },
    navigate
  );

  // TODO RECUPERER LE RAPPORT AVEC UN HOOK

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
          <Summary reportId={id} />
        </div>
        <div
          className={clsx(
            'flex-col gap-2',
            cx('fr-grid-row', 'fr-col-md-7', 'fr-col-lg-8', 'fr-col-xl-9')
          )}
        >
          <ReportOverviewState state={report.state} onUpdateState={() => {}} />
          <MagistratIdentity
            name={report.name}
            birthDate={report.birthDate}
            grade={report.grade}
            currentPosition={report.currentPosition}
            targettedPosition={report.targettedPosition}
            rank={report.rank}
            dureeDuPoste={report.dureeDuPoste}
          />
          <Biography biography={report.biography} />
          <ReportEditor
            comment={report.comment}
            onUpdate={() => {}}
            reportId={id}
          />
          <Observers observers={report.observers} />
          <ReportRules
            rulesChecked={report.rulesChecked}
            onUpdateReportRule={() => {}}
            reportId={id}
          />
          <AttachedFileUpload
            attachedFiles={report.attachedFiles}
            onFilesAttached={() => {}}
            onAttachedFileDeleted={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportOverview;
