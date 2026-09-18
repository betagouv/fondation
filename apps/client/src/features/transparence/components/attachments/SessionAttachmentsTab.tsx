import Button from '@codegouvfr/react-dsfr/Button';
import type { OnChangeFn, SortingState } from '@tanstack/react-table';
import { parseAsString, useQueryState } from 'nuqs';
import { useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTab } from '@/shared/hooks/useTab';
import { DropdownFilter } from '@/shared/ui/DropdownFilter';
import { IconButton } from '@/shared/ui/icon-button';
import { ACTION_ICONS } from '@/shared/ui/icons';
import { SearchInput } from '@/shared/ui/search-input';
import { useToasts } from '@/shared/ui/toast';
import { TotalBadge } from '@/shared/ui/total-badge';
import { formatFileSize } from '@/utils/file.utils';
import { unaccent } from '@/utils/string.utils';
import { useDownloadFileMutation } from '@queries/files.queries';
import {
  useCreateNominationSessionAttachmentUrlMutation,
  useListNominationSessionAttachmentsQuery,
} from '@queries/nomination-sessions.queries';

import { SessionAttachmentsTable, type SessionAttachment } from './SessionAttachmentsTable';

export function SessionAttachmentsTab(props: {
  extraActions?: (attachment: SessionAttachment) => ReactNode;
  filtersSlot: Element | null;
  headerEnd?: ReactNode;
  headerStart?: ReactNode;
  scrollsWithPage?: boolean;
  sessionId: string;
  toolbarSlot?: Element | null;
}) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const tab = useTab();

  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));
  const [sort, setSort] = useQueryState('sort', parseAsString);

  const [column, direction] = (sort ?? '').split(':');
  const sorting: SortingState = column ? [{ desc: direction !== 'asc', id: column }] : [];

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const [next] = typeof updater === 'function' ? updater(sorting) : updater;
    setSort(next ? `${next.id}:${next.desc ? 'desc' : 'asc'}` : null);
  };

  const { data: attachments } = useListNominationSessionAttachmentsQuery({ sessionId: props.sessionId });
  const { mutate: createUrl, isPending: isUrlPending } = useCreateNominationSessionAttachmentUrlMutation();
  const { mutate: download, isPending: isDownloadPending } = useDownloadFileMutation();

  const onOpen = useCallback(
    (fileId: string) => {
      const attachmentTab = tab.openDeferred({
        message: formatMessage({ defaultMessage: 'Ouverture de la pièce jointe, merci de patienter...' }),
        title: formatMessage({ defaultMessage: 'Pièce jointe' }),
      });

      createUrl(
        { fileId, sessionId: props.sessionId },
        {
          onError: () => attachmentTab.cancel(),
          onSuccess: (response) => {
            if (response) attachmentTab.settle(response.url);
            else attachmentTab.cancel();
          },
        },
      );
    },
    [createUrl, formatMessage, props.sessionId, tab],
  );

  const notifyDownloadFailure = useCallback(
    (name: string) =>
      toasts.error({
        description: formatMessage({
          defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
        }),
        title: formatMessage({ defaultMessage: 'Le téléchargement de "{name}" a échoué' }, { name }),
      }),
    [formatMessage, toasts],
  );

  const onDownload = useCallback(
    (attachment: SessionAttachment) =>
      createUrl(
        { fileId: attachment.id, sessionId: props.sessionId },
        {
          onError: () => notifyDownloadFailure(attachment.name),
          onSuccess: (response) => {
            if (!response) return;
            download(
              { name: attachment.name, url: response.url },
              { onError: () => notifyDownloadFailure(attachment.name) },
            );
          },
        },
      ),
    [createUrl, download, notifyDownloadFailure, props.sessionId],
  );

  const allAttachments = attachments?.items ?? [];
  const items = allAttachments.filter((attachment) =>
    unaccent(attachment.name).toLowerCase().includes(unaccent(search).toLowerCase()),
  );
  const totalSizeInBytes = allAttachments.reduce((total, { sizeInBytes }) => total + (sizeInBytes ?? 0), 0);

  const sortOptions = [
    { label: formatMessage({ defaultMessage: 'Les plus récentes' }), value: 'addedAt:desc' },
    { label: formatMessage({ defaultMessage: 'Les plus anciennes' }), value: 'addedAt:asc' },
  ];

  const downloadAction = (attachment: SessionAttachment) => (
    <IconButton
      disabled={isUrlPending || isDownloadPending}
      iconId={ACTION_ICONS.download}
      label={formatMessage({ defaultMessage: 'Télécharger {name}' }, { name: attachment.name })}
      onClick={() => onDownload(attachment)}
      small
    />
  );

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
        placeholder={formatMessage({ defaultMessage: 'Rechercher une pièce jointe' })}
        value={search}
      />
    </div>
  );

  const toolbar = (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        {props.headerStart}
        <TotalBadge value={allAttachments.length}>
          <FormattedMessage defaultMessage="Total" />
        </TotalBadge>
        <TotalBadge value={totalSizeInBytes > 0 ? formatFileSize(totalSizeInBytes) : 0}>
          <FormattedMessage defaultMessage="Taille" />
        </TotalBadge>
      </div>

      {props.headerEnd}
    </div>
  );

  return (
    <div className="flex flex-col gap-y-4">
      {props.filtersSlot ? createPortal(filters, props.filtersSlot) : filters}

      {props.toolbarSlot ? createPortal(toolbar, props.toolbarSlot) : toolbar}

      <SessionAttachmentsTable
        actions={props.extraActions ? [downloadAction, props.extraActions] : [downloadAction]}
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
        scrollsWithPage={props.scrollsWithPage}
        sorting={sorting}
      />
    </div>
  );
}
