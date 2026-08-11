import { useExcludedJurisdictions } from '@/features/nomination-files-table/context/excluded-jurisdictions.context';
import { ReporterTagList } from '@/shared/components/reporter-tag';
import { useUser } from '@queries/auth.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { ExcludedJurisdictionAlert } from './ExcludedJurisdictionAlert';

export function ReportersCell(props: { dossier: SessionNominationFile }) {
  const { user } = useUser();
  const excludedJurisdictions = useExcludedJurisdictions();
  const conflicts = excludedJurisdictions.conflictsFor(
    props.dossier,
    props.dossier.reporters.map(({ id }) => id),
  );

  const reporters = props.dossier.reporters.map((reporter) => {
    const memberConflicts = conflicts.filter(({ memberId }) => memberId === reporter.id);

    return {
      ...reporter,
      icon:
        memberConflicts.length > 0 ? <ExcludedJurisdictionAlert conflicts={memberConflicts} /> : undefined,
      isCurrentUser: reporter.id === user?.id,
    };
  });

  if (props.dossier.reporters.length === 0) return '-';

  return (
    <div className="flex items-center">
      <ReporterTagList reporters={reporters} />
    </div>
  );
}
