import type { ExcludedJurisdictionConflict } from '../context/member-excluded-jurisdictions';
import { AlertBanner } from '@/shared/ui/alert-banner';

import { ExcludedJurisdictionLines } from './ExcludedJurisdictionLines';

export function ExcludedJurisdictionNotice(props: { conflicts: readonly ExcludedJurisdictionConflict[] }) {
  return (
    /** @warning the live region is always rendered: a screen reader ignores one that appears already filled */
    <div role="status">
      {props.conflicts.length > 0 && (
        <AlertBanner
          className="mt-2 px-4 py-4"
          icon="fr-icon-warning-fill"
          message={<ExcludedJurisdictionLines conflicts={props.conflicts} />}
          tone="warning"
        />
      )}
    </div>
  );
}
