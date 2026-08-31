import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { useOutletContext } from 'react-router';

import { AffectationVersionStatusBadge } from '@/features/nomination-files-table/components/AffectationVersionStatusBadge';
import { DocActionAgendaFiles } from '@/features/transparence/components/documents/DocActionAgendaFiles';
import { DocActionAgendaMetadata } from '@/features/transparence/components/documents/DocActionAgendaMetadata';
import { DocActionDelete } from '@/features/transparence/components/documents/DocActionDelete';
import { DocActionDetails } from '@/features/transparence/components/documents/DocActionDetails';
import { DocActionUpdate } from '@/features/transparence/components/documents/DocActionUpdate';
import { DocGenerationMenu } from '@/features/transparence/components/documents/DocGenerationMenu';
import {
  groupSessionDocuments,
  sessionDocumentGroupState,
  SESSION_DOCUMENT_GROUP_STATES,
  type SessionDocumentGroupState,
} from '@/features/transparence/components/documents/session-document-groups';
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
  const { filtersSlot, transparence } = useOutletContext<TransparenceOutletContext>();

  const [isActing, setIsActing] = useState(false);

  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));
  const [states, setStates] = useQueryState('etat', parseAsArrayOf(parseAsString).withDefault([]));

  const { data: docs } = useFindSessionDocsQuery({ sessionId: transparence.id });

  const allDocs = docs?.items ?? [];
  const items = groupSessionDocuments(allDocs)
    .filter(
      (group) =>
        (states.length === 0 || states.includes(sessionDocumentGroupState(group))) &&
        (!search || group.some((doc) => matchesSearch(doc.name, search))),
    )
    .flat();

  const isFiltered = states.length > 0 || !!search.trim();
  const stateLabels: Record<SessionDocumentGroupState, string> = {
    awaitingOfficialReport: formatMessage({ defaultMessage: 'PV attendu' }),
    outdatedOfficialReport: formatMessage({ defaultMessage: 'PV à vérifier' }),
    upToDate: formatMessage({ defaultMessage: 'PV à jour' }),
  };

  const filters = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span>
          {isFiltered ? (
            <FormattedMessage
              defaultMessage="{count, plural, one {# document} other {# documents}}"
              values={{ count: items.length }}
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

  return (
    <div className="flex flex-col gap-y-4">
      {filtersSlot ? createPortal(filters, filtersSlot) : filters}

      <div className="flex min-h-10 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <AffectationVersionStatusBadge sessionId={transparence.id} />
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

      <SessionDocumentsTable
        actions={(doc) =>
          isArchived ? null : (
            <div className="-ml-2 grid grid-cols-4 items-center gap-1">
              {doc.type === 'agenda' && (
                <>
                  <DocActionAgendaFiles
                    agendaId={doc.id}
                    disabled={isActing}
                    name={doc.name}
                    sessionId={transparence.id}
                  />
                  <DocActionAgendaMetadata
                    agendaId={doc.id}
                    disabled={isActing}
                    name={doc.name}
                    sessionId={transparence.id}
                  />
                </>
              )}
              <div className="col-start-3">
                <DocActionUpdate disabled={isActing} doc={doc} sessionId={transparence.id} />
              </div>
              <DocActionDelete disabled={isActing} doc={doc} sessionId={transparence.id} />
            </div>
          )
        }
        docs={items}
        renderName={(doc) => (
          <DocActionDetails
            disabled={isActing}
            doc={doc}
            sessionId={transparence.id}
            setIsActing={setIsActing}
          />
        )}
      />
    </div>
  );
}
