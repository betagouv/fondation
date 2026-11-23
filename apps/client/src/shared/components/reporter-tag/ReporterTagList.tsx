import Tag from '@codegouvfr/react-dsfr/Tag';
import { useIntl } from 'react-intl';

import { Tooltip } from '@/shared/ui/tooltip';
import { memberFullName } from '@/utils/user.utils';
import { useUser } from '@queries/auth.queries';

import { ReporterTag } from './ReporterTag';

export function ReporterTagList(props: {
  max?: number;
  reporters: readonly { excludedTitle?: string; firstName: string; id: string; lastName: string }[];
}) {
  const intl = useIntl();
  const { user } = useUser();
  if (props.reporters.length === 0) return null;

  const reporters = props.reporters
    .map((reporter) => ({ ...reporter, isCurrentUser: reporter.id === user?.id }))
    .toSorted(
      (a, b) => Number(b.isCurrentUser) - Number(a.isCurrentUser) || a.lastName.localeCompare(b.lastName),
    );
  const max = props.max ?? 3;
  const hidden = reporters.slice(max);

  return (
    <ul className="fr-m-0 fr-p-0 flex list-none flex-row flex-wrap items-center gap-x-2 gap-y-1">
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
