import clsx from 'clsx';
import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';

/** tabs set on the top edge of the table they switch, the current one merging into its header */
export function AttachedLinkTabs(props: { ariaLabel: string; children: ReactNode }) {
  return (
    <nav aria-label={props.ariaLabel}>
      <ul className="fr-m-0 fr-p-0 flex min-h-9 w-full list-none gap-1">{props.children}</ul>
    </nav>
  );
}

export function AttachedLinkTab(props: {
  count?: number;
  /** keeps the query of the page, where nuqs writes the filters of a table without telling the router */
  keepsQuery?: boolean;
  label: string;
  to: string;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <li className="fr-p-0 flex flex-auto">
      <NavLink
        className={({ isActive }) =>
          clsx(
            'fr-px-4v fr-py-2v flex w-full items-center justify-center gap-2 bg-none! text-sm leading-5 font-medium whitespace-nowrap no-underline!',
            isActive
              ? 'relative z-3 -mb-px border-x border-t border-(--border-contrast-grey) bg-(--background-contrast-grey)! text-(--text-active-blue-france)'
              : 'bg-(--background-action-low-blue-france)! text-(--text-action-high-blue-france) hover:bg-(--background-action-low-blue-france-hover)!',
          )
        }
        onClick={(event) => {
          if (!props.keepsQuery || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey)
            return;
          event.preventDefault();
          // replaces the entry, as Link does, when the tab is already the current one
          void navigate(
            { pathname: props.to, search: window.location.search },
            { replace: pathname === props.to },
          );
        }}
        to={props.to}
      >
        {({ isActive }) => (
          <>
            {props.label}
            {Number.isFinite(props.count) && (
              <span
                className={clsx(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-xs font-normal text-(--text-mention-grey)',
                  // a shade darker on the grey of the current tab, where the off-white would hardly show
                  isActive ? 'bg-(--background-contrast-grey-hover)' : 'bg-(--background-alt-grey)',
                )}
              >
                {props.count}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}
