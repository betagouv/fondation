import { colors } from '@codegouvfr/react-dsfr';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  excludedJurisdictionLines,
  type ExcludedJurisdictionConflict,
} from '../context/member-excluded-jurisdictions';

import { ExcludedJurisdictionIcon } from './ExcludedJurisdictionIcon';

export function ExcludedJurisdictionNotice(props: { conflicts: readonly ExcludedJurisdictionConflict[] }) {
  const { formatList } = useIntl();

  return (
    /** @warning the live region is always rendered: a screen reader ignores one that appears already filled */
    <div role="status">
      <ul className="fr-mb-0 mt-2 flex flex-col gap-1 empty:mt-0">
        {excludedJurisdictionLines(props.conflicts).map(({ jurisdictions, memberNames }, index) => (
          <li
            className="flex items-center gap-1.5 text-sm"
            key={JSON.stringify(jurisdictions)}
            style={{ color: colors.decisions.text.default.warning.default }}
          >
            {index === 0 ? <ExcludedJurisdictionIcon /> : <span aria-hidden className="w-4 shrink-0" />}
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
    </div>
  );
}
