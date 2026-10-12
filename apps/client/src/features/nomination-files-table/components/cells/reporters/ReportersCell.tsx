import {
  useExcludedJurisdictions,
  useExcludedJurisdictionTitles,
} from '@/features/nomination-files-table/context/excluded-jurisdictions.context';
import { ReporterTagList } from '@/shared/components/reporter-tag';
import { useUser } from '@queries/auth.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export function ReportersCell(props: { dossier: SessionNominationFile }) {
  const { user } = useUser();
  const excludedJurisdictions = useExcludedJurisdictions();
  const conflicts = excludedJurisdictions.conflictsFor(
    props.dossier,
    props.dossier.reporters.map(({ id }) => id),
  );
  const excludedTitleByReporterId = useExcludedJurisdictionTitles(conflicts);

  const reporters = props.dossier.reporters.map((reporter) => ({
    ...reporter,
    excludedTitle: excludedTitleByReporterId.get(reporter.id),
    isCurrentUser: reporter.id === user?.id,
  }));

  if (props.dossier.reporters.length === 0) return '-';

  return (
    <div className="flex items-center">
      <ReporterTagList reporters={reporters} />
    </div>
  );
}
