import type { ExcludedJurisdictionConflict } from '../context/member-excluded-jurisdictions';

import { ExcludedJurisdictionIcon } from './ExcludedJurisdictionIcon';
import { ExcludedJurisdictionLines } from './ExcludedJurisdictionLines';

export function ExcludedJurisdictionNotice(props: { conflicts: readonly ExcludedJurisdictionConflict[] }) {
  return (
    /** @warning the live region is always rendered: a screen reader ignores one that appears already filled */
    <div role="status">
      {props.conflicts.length > 0 && (
        <div className="mt-1 flex items-start gap-2 text-sm text-(--text-default-warning)">
          <ExcludedJurisdictionIcon />
          <ExcludedJurisdictionLines conflicts={props.conflicts} />
        </div>
      )}
    </div>
  );
}
