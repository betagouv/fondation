import Button from '@codegouvfr/react-dsfr/Button';
import type { OnChangeFn, SortingState } from '@tanstack/react-table';
import { parseAsString, useQueryState } from 'nuqs';
import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { useOutletContext, useParams } from 'react-router';

import { ACTION_ICONS } from '@/constants/icons.constants';
import { AffectationVersionStatusBadge } from '@/features/nomination-files-table/components/AffectationVersionStatusBadge';
import { modal as importAttachmentsModal } from '@/features/transparence/components/attachments/ImportAttachmentModal';
import { SessionAttachmentsTable } from '@/features/transparence/components/attachments/SessionAttachmentsTable';
import { useArchivedSession } from '@/shared/context/archived-session';
import { useTab } from '@/shared/hooks/useTab';
import { DeleteFileButton } from '@/shared/ui/DeleteFileButton';
import { DropdownFilter } from '@/shared/ui/DropdownFilter';
import { IconButton } from '@/shared/ui/icon-button';
import { SearchInput } from '@/shared/ui/search-input';
import { TotalBadge } from '@/shared/ui/total-badge';
import { formatFileSize } from '@/utils/file.utils';
import { unaccent } from '@/utils/string.utils';
import {
  useCreateNominationSessionAttachmentUrlMutation,
  useListNominationSessionAttachmentsQuery,
  useRemoveNominationSessionAttachmentMutation,
} from '@queries/nomination-sessions.queries';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparenceAttachmentsTab() {
  const { formatMessage } = useIntl();
  const { sessionId } = useParams();
  const { isArchived } = useArchivedSession();
  const { filtersSlot } = useOutletContext<TransparenceOutletContext>();
  const tab = useTab();

  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));
  const [sort, setSort] = useQueryState('sort', parseAsString);

  const [column, direction] = (sort ?? '').split(':');
  const sorting: SortingState = column ? [{ desc: direction !== 'asc', id: column }] : [];

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const [next] = typeof updater === 'function' ? updater(sorting) : updater;
    setSort(next ? `${next.id}:${next.desc ? 'desc' : 'asc'}` : null);
  };

  const { data: attachments } = useListNominationSessionAttachmentsQuery({
    sessionId: sessionId!,
  });
  const { mutate: createUrl, isPending: isUrlPending } = useCreateNominationSessionAttachmentUrlMutation();
  const { mutate: deleteAttachment } = useRemoveNominationSessionAttachmentMutation();

  const onOpen = useCallback(
    (fileId: string) => {
      const attachmentTab = tab.openDeferred();

      createUrl(
        { fileId, sessionId: sessionId! },
        {
          onError: () => attachmentTab.cancel(),
          onSuccess: (response) => {
            if (response) attachmentTab.settle(response.url);
            else attachmentTab.cancel();
          },
        },
      );
    },
    [createUrl, sessionId, tab],
  );

  const onDownload = useCallback(
    (fileId: string) =>
      createUrl(
        { fileId, sessionId: sessionId! },
        {
          onSuccess: (response) => {
            if (!response) return;
            const { pathname } = new URL(response.url);
            tab.download(`${pathname}?download`);
          },
        },
      ),
    [createUrl, sessionId, tab],
  );

  const allAttachments = attachments?.items ?? [];
  const items = allAttachments.filter((attachment) =>
    unaccent(attachment.name).toLowerCase().includes(unaccent(search).toLowerCase()),
  );
  const totalSizeInBytes = allAttachments.reduce((total, { sizeInBytes }) => total + (sizeInBytes ?? 0), 0);

  const sortOptions = [
    {
      label: formatMessage({ defaultMessage: 'Les plus récentes' }),
      value: 'addedAt:desc',
    },
    {
      label: formatMessage({ defaultMessage: 'Les plus anciennes' }),
      value: 'addedAt:asc',
    },
  ];

  const filters = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span>
          {search.trim() ? (
            <FormattedMessage
              defaultMessage="{count, plural, one {# pièce jointe} other {# pièces jointes}}"
              values={{ count: items.length }}
            />
          ) : (
            <FormattedMessage defaultMessage="Trier par" />
          )}
        </span>

        <DropdownFilter
          onSelectionChange={(selection) => setSort(selection.find((value) => value !== sort) ?? null)}
          options={sortOptions}
          selectedValues={sort ? [sort] : []}
          tagName={formatMessage({ defaultMessage: "Date d'ajout" })}
        />
      </div>

      <SearchInput
        className="w-72"
        onChange={(value) => setSearch(value || null)}
        onClear={() => setSearch(null)}
        placeholder={formatMessage({
          defaultMessage: 'Rechercher une pièce jointe',
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
          <TotalBadge value={allAttachments.length}>
            <FormattedMessage defaultMessage="Total" />
          </TotalBadge>
          <TotalBadge value={totalSizeInBytes > 0 ? formatFileSize(totalSizeInBytes) : 0}>
            <FormattedMessage defaultMessage="Taille" />
          </TotalBadge>
        </div>

        {!isArchived && (
          <Button
            className="py-2!"
            iconId="fr-icon-add-line"
            nativeButtonProps={importAttachmentsModal.buttonProps}
            priority="primary"
            size="small"
          >
            <FormattedMessage defaultMessage="Ajouter une pièce jointe" />
          </Button>
        )}
      </div>

      <SessionAttachmentsTable
        actions={(attachment) => (
          <div className="-ml-2 flex items-center gap-1">
            <IconButton
              disabled={isUrlPending}
              iconId={ACTION_ICONS.download}
              label={formatMessage({ defaultMessage: 'Télécharger {name}' }, { name: attachment.name })}
              onClick={() => onDownload(attachment.id)}
            />

            {!isArchived && (
              <DeleteFileButton
                fileName={attachment.name}
                onDelete={() =>
                  deleteAttachment({
                    fileId: attachment.id,
                    sessionId: sessionId!,
                  })
                }
              />
            )}
          </div>
        )}
        attachments={items}
        onSortingChange={onSortingChange}
        renderName={(attachment) => (
          <Button
            className="fr-btn--align-on-content grow truncate text-left"
            disabled={isUrlPending}
            onClick={() => onOpen(attachment.id)}
            priority="tertiary no outline"
            size="small"
            title={formatMessage({ defaultMessage: 'Ouvrir {name}' }, { name: attachment.name })}
          >
            {attachment.name}
          </Button>
        )}
        sorting={sorting}
      />
    </div>
  );
}
