import clsx from 'clsx';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

/** what happened, the latest first and marked: one dot per event on a vertical line */
export function Timeline(props: {
  items: { at: string; content: ReactNode; key: string }[];
  size?: 'medium' | 'small';
}) {
  const { formatDate, formatTime } = useIntl();

  return (
    <ul className="fr-m-0 fr-p-0 fr-pl-4v flex list-none flex-col gap-3 border-l border-(--border-default-grey)">
      {props.items.map(({ at, content, key }, index) => (
        <li className="fr-p-0 relative" key={key}>
          <span
            aria-hidden
            className={`absolute top-1.5 -left-[calc(1rem+4.5px)] size-2 rounded-full ${index === 0 ? 'bg-(--background-action-high-blue-france)' : 'bg-(--border-default-grey)'}`}
          />
          <p
            className={clsx(
              'fr-mb-0 text-(--text-mention-grey)',
              props.size === 'small' ? 'fr-text--xs' : 'fr-text--sm',
            )}
          >
            <FormattedMessage
              defaultMessage="{date} à {time}"
              values={{
                date: formatDate(at, { format: 'zonedDateShort' }),
                time: formatTime(at, { format: 'zonedTimeShort' }),
              }}
            />
          </p>
          <p className={clsx('fr-mb-0', props.size === 'small' && 'fr-text--sm')}>{content}</p>
        </li>
      ))}
    </ul>
  );
}
