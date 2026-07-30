import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  excludedJurisdictionLines,
  type ExcludedJurisdictionConflict,
} from '../hooks/useExcludedJurisdictionConflicts.hook';

export function ExcludedJurisdictionNotice(props: { conflicts: readonly ExcludedJurisdictionConflict[] }) {
  const { formatList } = useIntl();
  if (props.conflicts.length === 0) return null;

  return (
    <ul className="fr-mb-0 mt-2 flex flex-col gap-1" role="alert">
      {excludedJurisdictionLines(props.conflicts).map(({ jurisdictions, memberNames }, index) => (
        <li
          className="flex items-center gap-1.5 text-sm"
          key={jurisdictions.join()}
          style={{ color: colors.decisions.text.default.warning.default }}
        >
          {index === 0 ? (
            <i aria-hidden className={clsx(cx('fr-icon-warning-fill'), 'fr-icon--sm')} />
          ) : (
            <span aria-hidden className="w-4 shrink-0" />
          )}
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
