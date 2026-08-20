import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { useOutletContext, useParams } from 'react-router';

import { AffectationVersionStatusBadge } from '@/features/nomination-files-table/components/AffectationVersionStatusBadge';
import { DocActionAgendaFiles } from '@/features/transparence/components/documents/DocActionAgendaFiles';
import { DocActionAgendaMetadata } from '@/features/transparence/components/documents/DocActionAgendaMetadata';
import { DocActionDelete } from '@/features/transparence/components/documents/DocActionDelete';
import { DocActionDetails } from '@/features/transparence/components/documents/DocActionDetails';
import { DocActionUpdate } from '@/features/transparence/components/documents/DocActionUpdate';
import { DocGenerationMenu } from '@/features/transparence/components/documents/DocGenerationMenu';
import { SessionDocumentsTable } from '@/features/transparence/components/documents/SessionDocumentsTable';
import { useArchivedSession } from '@/shared/context/archived-session';
import { DropdownFilter } from '@/shared/ui/DropdownFilter';
import { SearchInput } from '@/shared/ui/search-input';
import { TotalBadge } from '@/shared/ui/total-badge';
import { unaccent } from '@/utils/string.utils';
import { useFindSessionDocsQuery } from '@queries/agenda.queries';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

const DOC_TYPES = ['agenda', 'officialReport'] as const;

function matchesSearch(name: string, search: string) {
  return unaccent(name).toLowerCase().includes(unaccent(search).toLowerCase());
}

export function TransparenceDocumentsTab() {
  const { formatMessage } = useIntl();
  const { sessionId } = useParams();
  const { isArchived } = useArchivedSession();
  const { filtersSlot } = useOutletContext<TransparenceOutletContext>();

  const [isActing, setIsActing] = useState(false);

  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));
  const [types, setTypes] = useQueryState('type', parseAsArrayOf(parseAsString).withDefault([]));

  const { data: docs } = useFindSessionDocsQuery({ sessionId: sessionId! });

  const allDocs = docs?.items ?? [];
  const items = allDocs.filter(
    (doc) => (types.length === 0 || types.includes(doc.type)) && (!search || matchesSearch(doc.name, search)),
  );

  const isFiltered = types.length > 0 || !!search.trim();
  const typeLabels: Record<(typeof DOC_TYPES)[number], string> = {
    agenda: formatMessage({ defaultMessage: 'Ordre du jour' }),
    officialReport: formatMessage({ defaultMessage: 'Procès-verbal' }),
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
          onSelectionChange={(selection) => setTypes(selection.length ? selection : null)}
          options={DOC_TYPES.map((value) => ({
            label: typeLabels[value],
            value,
          }))}
          selectedValues={types}
          tagName={formatMessage({ defaultMessage: 'Type de document' })}
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
          <AffectationVersionStatusBadge sessionId={sessionId!} />
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

        {!isArchived && <DocGenerationMenu sessionId={sessionId!} />}
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
                    sessionId={sessionId!}
                  />
                  <DocActionAgendaMetadata
                    agendaId={doc.id}
                    disabled={isActing}
                    name={doc.name}
                    sessionId={sessionId!}
                  />
                </>
              )}
              <div className="col-start-3">
                <DocActionUpdate disabled={isActing} doc={doc} sessionId={sessionId!} />
              </div>
              <DocActionDelete disabled={isActing} doc={doc} sessionId={sessionId!} />
            </div>
          )
        }
        docs={items}
        renderName={(doc) => (
          <DocActionDetails disabled={isActing} doc={doc} sessionId={sessionId!} setIsActing={setIsActing} />
        )}
      />
    </div>
  );
}
