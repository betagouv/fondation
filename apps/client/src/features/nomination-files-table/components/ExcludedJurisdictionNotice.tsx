import { FormattedMessage, useIntl } from 'react-intl';

import {
  excludedJurisdictionLines,
  type ExcludedJurisdictionConflict,
} from '../context/member-excluded-jurisdictions';
import { AlertBanner } from '@/shared/ui/alert-banner';

export function ExcludedJurisdictionNotice(props: { conflicts: readonly ExcludedJurisdictionConflict[] }) {
  const { formatList } = useIntl();
  const lines = excludedJurisdictionLines(props.conflicts);

  return (
    /** @warning the live region is always rendered: a screen reader ignores one that appears already filled */
    <div role="status">
      {lines.length > 0 && (
        <AlertBanner
          className="mt-2 px-4 py-2"
          icon="fr-icon-warning-fill"
          message={
            <ul className="fr-mb-0 flex flex-col gap-1">
              {lines.map(({ jurisdictions, memberNames }) => (
                <li key={JSON.stringify(jurisdictions)}>
                  <FormattedMessage
                    defaultMessage="{count, plural, one {Juridiction exclue} other {Juridictions exclues}} pour {memberNames} : {jurisdictions}"
                    values={{
                      count: jurisdictions.length,
                      jurisdictions: formatList(jurisdictions),
                      memberNames: formatList(memberNames),
                    }}
                  />
                </li>
              ))}
            </ul>
          }
          tone="warning"
        />
      )}
    </div>
  );
}
