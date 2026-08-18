import { ExcludedJurisdictionIcon } from '@/features/nomination-files-table/components/ExcludedJurisdictionIcon';
import { ExcludedJurisdictionLines } from '@/features/nomination-files-table/components/ExcludedJurisdictionLines';
import { useExcludedJurisdictions } from '@/features/nomination-files-table/context/excluded-jurisdictions.context';
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
  const excludedReporterIds = new Set(conflicts.map(({ memberId }) => memberId));

  const reporters = props.dossier.reporters.map((reporter) => ({
    ...reporter,
    icon: excludedReporterIds.has(reporter.id) ? <ExcludedJurisdictionIcon /> : undefined,
    isCurrentUser: reporter.id === user?.id,
  }));

  if (props.dossier.reporters.length === 0) return '-';

  return (
    <div className="flex items-center">
      <ReporterTagList
        details={<ExcludedJurisdictionLines className="mt-1" conflicts={conflicts} />}
        reporters={reporters}
      />
    </div>
  );
}
