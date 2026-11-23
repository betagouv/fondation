import { excludedJurisdictionConflictsOf } from '@/features/nomination-files-table/context/member-excluded-jurisdictions';
import { useReporterWarnings } from '@/features/nomination-files-table/context/reporter-warnings';
import { useExcludedJurisdictionTitles } from '@/features/nomination-files-table/hooks/useExcludedJurisdictionTitles';
import { ReporterTagList } from '@/shared/components/reporter-tag';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export function ReportersCell(props: { dossier: SessionNominationFile }) {
  const conflicts = excludedJurisdictionConflictsOf(
    props.dossier,
    props.dossier.reporters.map(({ id }) => id),
  );
  const excludedTitleByReporterId = useReporterWarnings(
    props.dossier,
    useExcludedJurisdictionTitles(conflicts),
  );

  const reporters = props.dossier.reporters.map((reporter) => ({
    ...reporter,
    excludedTitle: excludedTitleByReporterId.get(reporter.id),
  }));

  if (props.dossier.reporters.length === 0) return '-';

  return (
    <div className="flex items-center">
      <ReporterTagList reporters={reporters} />
    </div>
  );
}
