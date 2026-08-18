import { ExcludedJurisdictionIcon } from '@/features/nomination-files-table/components/ExcludedJurisdictionIcon';
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
    icon: excludedTitleByReporterId.has(reporter.id) ? <ExcludedJurisdictionIcon /> : undefined,
    isCurrentUser: reporter.id === user?.id,
  }));

  if (props.dossier.reporters.length === 0) return '-';

  return (
    <div className="flex items-center">
      <ReporterTagList
        details={
          excludedTitleByReporterId.size > 0 ? (
            <ul className="fr-mb-0 mt-1 flex flex-col gap-1">
              {[...excludedTitleByReporterId].map(([reporterId, title]) => (
                <li key={reporterId}>{title}</li>
              ))}
            </ul>
          ) : undefined
        }
        reporters={reporters}
      />
    </div>
  );
}
