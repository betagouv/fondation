import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { useOutletContext } from 'react-router';

import { DocActionDetails } from '@/features/transparence/components/documents/DocActionDetails';
import { DocGenerationMenu } from '@/features/transparence/components/documents/DocGenerationMenu';
import { NewOfficialReportButton } from '@/features/transparence/components/documents/NewOfficialReportButton';
import {
  groupSessionDocuments,
  isSessionDocumentGroupState,
  SESSION_DOCUMENT_GROUP_STATES,
  sessionDocumentGroupState,
  type SessionDocumentGroupState,
} from '@/features/transparence/components/documents/session-document-groups';
import { SessionDocumentActions } from '@/features/transparence/components/documents/SessionDocumentActions';
import { SessionDocumentsTable } from '@/features/transparence/components/documents/SessionDocumentsTable';
import { useArchivedSession } from '@/shared/context/archived-session';
import { DropdownFilter } from '@/shared/ui/DropdownFilter';
import { SearchInput } from '@/shared/ui/search-input';
import { TotalBadge } from '@/shared/ui/total-badge';
import { unaccent } from '@/utils/string.utils';
import { useFindSessionDocsQuery } from '@queries/agenda.queries';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

function matchesSearch(name: string, search: string) {
  return unaccent(name).toLowerCase().includes(unaccent(search).toLowerCase());
}

export function TransparenceDocumentsTab() {
  const { formatMessage } = useIntl();
  const { isArchived } = useArchivedSession();
  const { filtersSlot, toolbarSlot, transparence } = useOutletContext<TransparenceOutletContext>();

  const [isActing, setIsActing] = useState(false);

  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));
  const [selectedStates, setStates] = useQueryState('etat', parseAsArrayOf(parseAsString).withDefault([]));

  const { data: docs } = useFindSessionDocsQuery({ sessionId: transparence.id });

  const allDocs = docs?.items ?? [];
  const states = selectedStates.filter(isSessionDocumentGroupState);
  const groups = groupSessionDocuments(allDocs).filter((group) => {
    const groupState = sessionDocumentGroupState(group);

    return (
      (states.length === 0 || (!!groupState && states.includes(groupState))) &&
      (!search || group.some((doc) => matchesSearch(doc.name, search)))
    );
  });
  const shownDocsCount = groups.reduce((count, group) => count + group.length, 0);

  const isFiltered = states.length > 0 || !!search.trim();
  const stateLabels: Record<SessionDocumentGroupState, string> = {
    awaitingOfficialReport: formatMessage({ defaultMessage: 'PV attendu' }),
    outdatedOfficialReport: formatMessage({ defaultMessage: 'PV à vérifier' }),
    upToDate: formatMessage({ defaultMessage: 'PV à jour' }),
    outdatedAgenda: formatMessage({ defaultMessage: 'ODJ à vérifier' }),
  };

  const filters = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span>
          {isFiltered ? (
            <FormattedMessage
              defaultMessage="{count, plural, one {# document} other {# documents}}"
              values={{ count: shownDocsCount }}
            />
          ) : (
            <FormattedMessage defaultMessage="Filtrer par" />
          )}
        </span>

        <DropdownFilter
          onSelectionChange={(selection) => setStates(selection.length ? selection : null)}
          options={SESSION_DOCUMENT_GROUP_STATES.map((value) => ({
            label: stateLabels[value],
            value,
          }))}
          selectedValues={states}
          tagName={formatMessage({ defaultMessage: 'État du procès-verbal' })}
        />
      </div>

      <SearchInput
        className="w-72"
        onChange={(value) => setSearch(value || null)}
        onClear={() => setSearch(null)}
        placeholder={formatMessage({
          defaultMessage: 'Rechercher un document',
        })}
        value={search}
      />
    </div>
  );

  const toolbar = (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <TotalBadge value={allDocs.length}>
          <FormattedMessage defaultMessage="Total" />
        </TotalBadge>
        <TotalBadge value={allDocs.filter(({ type }) => type === 'agenda').length}>
          <FormattedMessage defaultMessage="ODJ" />
        </TotalBadge>
        <TotalBadge value={allDocs.filter(({ type }) => type === 'officialReport').length}>
          <FormattedMessage defaultMessage="PV" />
        </TotalBadge>
      </div>

      {!isArchived && <DocGenerationMenu sessionId={transparence.id} />}
    </div>
  );

  return (
    <div className="flex flex-col gap-y-4">
      {filtersSlot ? createPortal(filters, filtersSlot) : filters}

      {toolbarSlot ? createPortal(toolbar, toolbarSlot) : toolbar}

      <SessionDocumentsTable
        actions={(doc) =>
          isArchived ? null : (
            <SessionDocumentActions disabled={isActing} doc={doc} sessionId={transparence.id} />
          )
        }
        groups={groups}
        newOfficialReport={(agenda) =>
          isArchived ? null : <NewOfficialReportButton agenda={agenda} sessionId={transparence.id} />
        }
        renderName={(doc) => (
          <DocActionDetails
            disabled={isActing}
            doc={doc}
            sessionId={transparence.id}
            setIsActing={setIsActing}
          />
        )}
        scrollsWithPage
      />
    </div>
  );
}
