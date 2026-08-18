import Tag from '@codegouvfr/react-dsfr/Tag';
import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { Tooltip } from '@/shared/ui/tooltip';
import { memberFullName } from '@/utils/user.utils';

import { ReporterTag } from './ReporterTag';

export function ReporterTagList(props: {
  details?: ReactNode;
  enableTooltip?: boolean;
  max?: number;
  reporters: readonly {
    firstName: string;
    icon?: ReactNode;
    id: string;
    isCurrentUser?: boolean;
    lastName: string;
  }[];
}) {
  const intl = useIntl();
  if (props.reporters.length === 0) return null;

  const reporters = props.reporters.toSorted((a, b) => a.lastName.localeCompare(b.lastName));
  const max = props.max ?? 3;

  const list = (
    <ul className="fr-m-0 fr-p-0 flex list-none flex-row items-center gap-x-2">
      {reporters.slice(0, max).map((reporter) => (
        <li className="fr-p-0" key={reporter.id}>
          <ReporterTag
            enableTooltip={false}
            icon={reporter.icon}
            isCurrentUser={reporter.isCurrentUser}
            reporter={reporter}
          />
        </li>
      ))}
      {reporters.length > max ? (
        <li className="fr-p-0">
          <Tag>+{reporters.length - max}</Tag>
        </li>
      ) : null}
    </ul>
  );

  if (props.enableTooltip === false) return list;

  return (
    <Tooltip
      label={
        <>
          {intl.formatList(reporters.map(memberFullName), { type: 'conjunction' })}
          {props.details}
        </>
      }
    >
      {list}
    </Tooltip>
  );
}
