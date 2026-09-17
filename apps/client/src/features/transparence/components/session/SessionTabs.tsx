import clsx from 'clsx';
import { useQueryState } from 'nuqs';
import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { generatePath, NavLink } from 'react-router';

import { ROUTE_PATHS, SIDE_PANEL_DOSSIER_PARAM } from '@/utils/route-path.utils';
import type { DetailedNominationSessionDto } from '@api/types';
import { useFindSessionDocsQuery } from '@queries/agenda.queries';
import {
  useListNominationSessionAttachmentsQuery,
  useNominationFilesStatusCountsQuery,
} from '@queries/nomination-sessions.queries';

function SessionTabsWrapper(props: { ariaLabel: string; children: ReactNode; dense?: boolean }) {
  return (
    <div className={props.dense ? 'fr-my-2v' : 'fr-mt-4v'}>
      <div className="mx-[calc(50%-50vw)] bg-(--background-contrast-grey) px-[calc(50vw-50%)]">
        <nav aria-label={props.ariaLabel}>
          <ul className="fr-m-0 fr-p-0 flex list-none items-center gap-8">{props.children}</ul>
        </nav>
      </div>
    </div>
  );
}

const SESSION_TAB_CLASS = 'fr-py-3v flex items-center gap-2 border-b-2 bg-none! px-3 text-sm no-underline!';

function SessionTab(props: {
  count?: number;
  disabled?: boolean;
  end?: boolean;
  icon: string;
  label: string;
  to: string;
}) {
  const content = (
    <>
      <i aria-hidden className={clsx(props.icon, 'fr-icon--sm')} />
      {props.label}
      {props.count !== undefined && (
        <>
          {' '}
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-(--background-default-grey) px-1.5 text-xs text-(--text-mention-grey)">
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
            SESSION_TAB_CLASS,
            'cursor-not-allowed border-transparent text-(--text-disabled-grey)',
          )}
        >
          {content}
        </span>
      ) : (
        <NavLink
          className={({ isActive }) =>
            clsx(
              SESSION_TAB_CLASS,
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

export function MemberSessionTabsBar(props: { dense?: boolean; sessionId: string }) {
  const { formatMessage } = useIntl();
  const [openedDossier] = useQueryState(SIDE_PANEL_DOSSIER_PARAM);

  const { data: attachments } = useListNominationSessionAttachmentsQuery({ sessionId: props.sessionId });

  const params = { sessionId: props.sessionId };
  const attachmentsCount = attachments?.items.length ?? 0;
  const isSidePanelOpen = openedDossier !== null;

  return (
    <SessionTabsWrapper
      ariaLabel={formatMessage({ defaultMessage: 'Sections de la transparence' })}
      dense={props.dense}
    >
      <SessionTab
        end
        icon="fr-icon-list-unordered"
        label={formatMessage({ defaultMessage: 'Propositions' })}
        to={generatePath(ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS, params)}
      />
      <SessionTab
        count={attachmentsCount}
        disabled={isSidePanelOpen}
        icon="ri-image-line"
        label={formatMessage(
          { defaultMessage: '{count, plural, one {Pièce jointe} other {Pièces jointes}}' },
          { count: attachmentsCount },
        )}
        to={generatePath(ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS_ATTACHMENTS, params)}
      />
    </SessionTabsWrapper>
  );
}

export function SessionTabsBar(props: { dense?: boolean; transparence: DetailedNominationSessionDto }) {
  const { transparence } = props;
  const { formatMessage } = useIntl();
  const [openedDossier] = useQueryState(SIDE_PANEL_DOSSIER_PARAM);

  const { data: docs } = useFindSessionDocsQuery({
    sessionId: transparence.id,
  });
  const { data: attachments } = useListNominationSessionAttachmentsQuery({
    sessionId: transparence.id,
  });
  const { data: fileCounts } = useNominationFilesStatusCountsQuery({
    sessionId: transparence.id,
  });

  const params = { sessionId: transparence.id };

  const propositionsCount = fileCounts?.total ?? 0;
  const missingEvaluationsCount = fileCounts?.missingEvaluation ?? 0;
  const docsCount = docs?.items.length ?? 0;
  const attachmentsCount = attachments?.items.length ?? 0;
  const isSidePanelOpen = openedDossier !== null;

  return (
    <SessionTabsWrapper
      ariaLabel={formatMessage({
        defaultMessage: 'Sections de la transparence',
      })}
      dense={props.dense}
    >
      <SessionTab
        count={propositionsCount}
        end
        icon="fr-icon-list-unordered"
        label={formatMessage(
          {
            defaultMessage: '{count, plural, one {Proposition} other {Propositions}}',
          },
          { count: propositionsCount },
        )}
        to={generatePath(ROUTE_PATHS.SG.SESSION_ID, params)}
      />
      <SessionTab
        count={missingEvaluationsCount}
        disabled={isSidePanelOpen}
        icon="fr-icon-draft-line"
        label={formatMessage(
          {
            defaultMessage: '{count, plural, one {Évaluation manquante} other {Évaluations manquantes}}',
          },
          { count: missingEvaluationsCount },
        )}
        to={generatePath(ROUTE_PATHS.SG.SESSION_ID_MISSING_EVALUATIONS, params)}
      />
      <SessionTab
        count={docsCount}
        disabled={isSidePanelOpen}
        icon="fr-icon-folder-2-line"
        label={formatMessage({ defaultMessage: 'Documents' })}
        to={generatePath(ROUTE_PATHS.SG.SESSION_ID_DOCUMENTS, params)}
      />
      <SessionTab
        count={attachmentsCount}
        disabled={isSidePanelOpen}
        icon="ri-image-line"
        label={formatMessage(
          {
            defaultMessage: '{count, plural, one {Pièce jointe} other {Pièces jointes}}',
          },
          { count: attachmentsCount },
        )}
        to={generatePath(ROUTE_PATHS.SG.SESSION_ID_ATTACHMENTS, params)}
      />
    </SessionTabsWrapper>
  );
}
