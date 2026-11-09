import clsx from 'clsx';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

export function LinkTabs(props: { ariaLabel: string; children: ReactNode }) {
  return (
    <div className="fr-mt-4v">
      <div className="mx-[calc(50%-50vw)] border-y border-(--border-default-grey) bg-(--background-default-grey) px-[calc(50vw-50%)]">
        <nav aria-label={props.ariaLabel}>
          <ul className="fr-m-0 fr-p-0 flex list-none items-center gap-8">{props.children}</ul>
        </nav>
      </div>
    </div>
  );
}

const LINK_TAB_CLASS = 'fr-py-3v flex items-center gap-2 border-b-2 bg-none! px-3 text-sm no-underline!';

export function LinkTab(props: {
  count?: number;
  disabled?: boolean;
  end?: boolean;
  icon?: string;
  label: string;
  to: string;
}) {
  const content = (
    <>
      {props.icon && <i aria-hidden className={clsx(props.icon, 'fr-icon--sm')} />}
      {props.label}
      {Number.isFinite(props.count) && (
        <>
          {' '}
          <span
            className={clsx(
              'inline-flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-xs',
              props.disabled
                ? 'bg-(--background-disabled-grey) text-(--text-disabled-grey)'
                : 'bg-(--background-contrast-grey) text-(--text-mention-grey)',
            )}
          >
            {props.count}
          </span>
        </>
      )}
    </>
  );

  return (
    <li className="fr-p-0">
      {props.disabled ? (
        <span
          aria-disabled
          className={clsx(
            LINK_TAB_CLASS,
            'cursor-not-allowed border-transparent text-(--text-disabled-grey)',
          )}
        >
          {content}
        </span>
      ) : (
        <NavLink
          className={({ isActive }) =>
            clsx(
              LINK_TAB_CLASS,
              isActive
                ? 'border-(--border-active-blue-france) font-medium text-(--text-active-blue-france)'
                : 'border-transparent text-(--text-label-grey)',
            )
          }
          end={props.end}
          to={props.to}
        >
          {content}
        </NavLink>
      )}
    </li>
  );
}
