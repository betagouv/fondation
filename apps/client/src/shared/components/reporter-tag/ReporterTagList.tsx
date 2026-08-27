import Tag from '@codegouvfr/react-dsfr/Tag';
import { useIntl } from 'react-intl';

import { Tooltip } from '@/shared/ui/tooltip';
import { memberFullName } from '@/utils/user.utils';

import { ReporterTag } from './ReporterTag';

export function ReporterTagList(props: {
  max?: number;
  reporters: readonly {
    excludedTitle?: string;
    firstName: string;
    id: string;
    isCurrentUser?: boolean;
    lastName: string;
  }[];
}) {
  const intl = useIntl();
  if (props.reporters.length === 0) return null;

  const reporters = props.reporters.toSorted((a, b) => a.lastName.localeCompare(b.lastName));
  const max = props.max ?? 3;
  const hidden = reporters.slice(max);

  return (
    <ul className="fr-m-0 fr-p-0 flex list-none flex-row items-center gap-x-2">
      {reporters.slice(0, max).map((reporter) => (
        <li className="fr-p-0" key={reporter.id}>
          <ReporterTag
            excludedTitle={reporter.excludedTitle}
            isCurrentUser={reporter.isCurrentUser}
            reporter={reporter}
          />
        </li>
      ))}
      {hidden.length > 0 ? (
        <li className="fr-p-0">
          <Tooltip
            label={intl.formatList(
              hidden.map((reporter) =>
                reporter.isCurrentUser
                  ? intl.formatMessage({ defaultMessage: 'Vous' })
                  : memberFullName(reporter),
              ),
              { type: 'conjunction' },
            )}
          >
            <Tag>+{hidden.length}</Tag>
          </Tooltip>
        </li>
      ) : null}
    </ul>
  );
}
