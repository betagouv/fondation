import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  excludedJurisdictionLines,
  type ExcludedJurisdictionConflict,
} from '../context/member-excluded-jurisdictions';

export function ExcludedJurisdictionLines(props: {
  className?: string;
  conflicts: readonly ExcludedJurisdictionConflict[];
}) {
  const { formatList } = useIntl();

  const lines = excludedJurisdictionLines(props.conflicts);
  if (lines.length === 0) return null;

  return (
    <ul className={clsx('fr-mb-0 flex flex-col gap-1', props.className)}>
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
  );
}
