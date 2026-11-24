import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { ApiClientChangesModal } from '@/features/api-clients/components/ApiClientChangesModal';
import { ApiClientCreationModal } from '@/features/api-clients/components/ApiClientCreationModal';
import { ApiClientSecretRotationModal } from '@/features/api-clients/components/ApiClientSecretRotationModal';
import { ApiClientUpdateModal } from '@/features/api-clients/components/ApiClientUpdateModal';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useBreadcrumbRoot } from '@/shared/hooks/useBreadcrumbRoot';
import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DataTable } from '@/shared/ui/data-table';
import { useToasts } from '@/shared/ui/toast';
import type { ListedApiClientsDto } from '@api/types';
import {
  useApiClientsQuery,
  useEndApiClientSecretRotationMutation,
  useRevokeApiClientMutation,
} from '@queries/api-clients.queries';

type ListedApiClient = ListedApiClientsDto['items'][number];

const h = createColumnHelper<ListedApiClient>();

function ApiClientStatusBadge(props: { status: ListedApiClient['status'] }) {
  const dateAndTime = useDateAndTime();

  switch (props.status.value) {
    case 'ACTIVE':
      return (
        <Badge noIcon severity="success" small>
          <FormattedMessage defaultMessage="Actif" />
        </Badge>
      );
    case 'ROTATING':
      return (
        <Badge noIcon severity="info" small>
          <FormattedMessage
            defaultMessage="Rotation jusqu'au {date} à {time}"
            values={dateAndTime(props.status.until)}
          />
        </Badge>
      );
    case 'REVOKED':
      return (
        <Badge noIcon severity="error" small>
          <FormattedMessage defaultMessage="Révoqué le {date}" values={dateAndTime(props.status.since)} />
        </Badge>
      );
  }
}

function LastTokenIssuedAt(props: { at: string | null }) {
  const dateAndTime = useDateAndTime();

  return props.at ? (
    <FormattedMessage defaultMessage="{date} à {time}" values={dateAndTime(props.at)} />
  ) : (
    <FormattedMessage defaultMessage="Jamais" />
  );
}

const actionsIdOf = (clientId: string) => `api-client-actions-${clientId}`;

/** The button that had the focus may be gone with the change: the focus stays on the row rather than falling to the page */
function keepFocusOnActionsOf(clientId: string) {
  if (document.activeElement !== document.body) return;
  const actions = document.getElementById(actionsIdOf(clientId));
  (actions?.querySelector('button') ?? actions)?.focus();
}

type ApiClientModal = 'changes' | 'rotation' | 'update';

type OpenModal = (modal: ApiClientModal, client: ListedApiClient) => void;

function ApiClientActions(props: { client: ListedApiClient; onOpen: OpenModal }) {
  const { formatMessage } = useIntl();
  const confirmation = useConfirmModal();
  const toasts = useToasts();
  const endRotation = useEndApiClientSecretRotationMutation();
  const revocation = useRevokeApiClientMutation();
  const { client } = props;
  const status = client.status.value;
  const shownStatus = useRef(status);

  useEffect(() => {
    if (shownStatus.current === status) return;
    shownStatus.current = status;
    keepFocusOnActionsOf(client.id);
  }, [client.id, status]);

  return (
    <div className="flex flex-wrap gap-2" id={actionsIdOf(client.id)} tabIndex={-1}>
      {client.canUpdate && (
        <Button onClick={() => props.onOpen('update', client)} priority="tertiary" size="small">
          <FormattedMessage defaultMessage="Modifier" />
        </Button>
      )}
      {client.canRotateSecret && (
        <Button onClick={() => props.onOpen('rotation', client)} priority="tertiary" size="small">
          <FormattedMessage defaultMessage="Lancer une rotation" />
        </Button>
      )}
      {client.canEndSecretRotation && (
        <Button
          disabled={endRotation.isPending}
          onClick={async () => {
            const { isConfirmed } = await confirmation.waitForConfirmation({
              content: formatMessage({
                defaultMessage:
                  "L'ancien secret et les jetons déjà émis seront refusés aussitôt. Le partenaire doit être passé au nouveau secret.",
              }),
              i18n: { confirm: formatMessage({ defaultMessage: 'Clore la rotation' }) },
              title: formatMessage(
                { defaultMessage: 'Clore la rotation de « {name} » ?' },
                { name: client.name },
              ),
            });
            if (!isConfirmed) return;
            endRotation.mutate(client.id, {
              onError: () =>
                toasts.error({
                  title: formatMessage(
                    { defaultMessage: "La rotation de « {name} » n'a pas pu être close" },
                    { name: client.name },
                  ),
                }),
            });
          }}
          priority="tertiary"
          size="small"
        >
          <FormattedMessage defaultMessage="Clore la rotation" />
        </Button>
      )}
      {client.canRevoke && (
        <Button
          disabled={revocation.isPending}
          onClick={async () => {
            const { isConfirmed } = await confirmation.waitForConfirmation({
              content: formatMessage({
                defaultMessage:
                  'Ses jetons cessent de fonctionner aussitôt. Une révocation est définitive : il faudra créer un nouveau client.',
              }),
              i18n: { confirm: formatMessage({ defaultMessage: 'Révoquer' }) },
              title: formatMessage({ defaultMessage: 'Révoquer « {name} » ?' }, { name: client.name }),
            });
            if (!isConfirmed) return;
            revocation.mutate(client.id, {
              onError: () =>
                toasts.error({
                  title: formatMessage(
                    { defaultMessage: "« {name} » n'a pas pu être révoqué" },
                    { name: client.name },
                  ),
                }),
            });
          }}
          priority="tertiary no outline"
          size="small"
        >
          <FormattedMessage defaultMessage="Révoquer" />
        </Button>
      )}
      <Button onClick={() => props.onOpen('changes', client)} priority="tertiary no outline" size="small">
        <FormattedMessage defaultMessage="Historique" />
      </Button>
    </div>
  );
}

function useApiClientColumns(onOpen: OpenModal) {
  const { formatMessage } = useIntl();

  return useMemo(
    () => [
      h.display({
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.name}</span>
            <span className="fr-text--xs fr-mb-0 font-mono">{row.original.id}</span>
          </div>
        ),
        header: formatMessage({ defaultMessage: 'Client' }),
        id: 'name',
        size: 320,
      }),
      h.display({
        cell: ({ row }) => (
          <ul className="fr-text--sm font-mono">
            {row.original.allowedIps.map(({ ip }) => (
              <li key={ip}>{ip}</li>
            ))}
          </ul>
        ),
        header: formatMessage({ defaultMessage: 'IP autorisées' }),
        id: 'allowedIps',
        size: 200,
      }),
      h.display({
        cell: ({ row }) => (
          <ul className="fr-text--sm">
            {row.original.scopes.map(({ limitPerMinute, scope }) => (
              <li key={scope.id}>
                <FormattedMessage
                  defaultMessage="{route} ({limit} par minute)"
                  values={{ limit: limitPerMinute, route: scope.label }}
                />
              </li>
            ))}
          </ul>
        ),
        header: formatMessage({ defaultMessage: 'Routes' }),
        id: 'scopes',
        size: 300,
      }),
      h.display({
        cell: ({ row }) => <ApiClientStatusBadge status={row.original.status} />,
        header: formatMessage({ defaultMessage: 'État' }),
        id: 'status',
        size: 220,
      }),
      h.display({
        cell: ({ row }) => <LastTokenIssuedAt at={row.original.lastTokenIssuedAt} />,
        header: formatMessage({ defaultMessage: 'Dernier jeton émis' }),
        id: 'lastTokenIssuedAt',
        size: 180,
      }),
      h.display({
        cell: ({ row }) => <ApiClientActions client={row.original} onOpen={onOpen} />,
        header: formatMessage({ defaultMessage: 'Actions' }),
        id: 'actions',
        size: 280,
      }),
    ],
    [formatMessage, onOpen],
  );
}

export function AdminApiClientsPage() {
  const { formatMessage } = useIntl();
  const breadcrumbRoot = useBreadcrumbRoot();
  const { data, isError, isFetching, isLoading, refetch } = useApiClientsQuery();
  const [isCreating, setCreating] = useState(false);
  const [opened, setOpened] = useState<{
    client: ListedApiClient;
    isOpen: boolean;
    modal: ApiClientModal;
  } | null>(null);
  const open = useCallback<OpenModal>((modal, client) => setOpened({ client, isOpen: true, modal }), []);
  const columns = useApiClientColumns(open);
  const modalProps = (modal: ApiClientModal) => ({
    client: opened?.modal === modal ? opened.client : null,
    onClose: () => setOpened((current) => current && { ...current, isOpen: false }),
    onClosed: () => {
      if (opened) keepFocusOnActionsOf(opened.client.id);
      setOpened(null);
    },
    open: opened?.modal === modal && opened.isOpen,
  });

  const table = useReactTable({
    columns,
    data: data?.items ?? [],
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="fr-container fr-pt-8v fr-pb-16v flex flex-col gap-y-6">
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane pour l'Administration" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Gérer les clients API' }),
          segments: breadcrumbRoot,
        }}
        id="administration-breadcrumb"
      />

      <div className="flex items-center justify-between gap-4">
        <h1 className="fr-h3 fr-mb-0">
          <FormattedMessage defaultMessage="Gérer les clients API" />
        </h1>
        <Button
          className="btn-compact"
          disabled={!data}
          iconId="fr-icon-add-line"
          onClick={() => setCreating(true)}
          priority="secondary"
          size="small"
        >
          <FormattedMessage defaultMessage="Créer un client API" />
        </Button>
      </div>

      <DataTable
        ariaLabel={formatMessage({ defaultMessage: 'Liste des clients API' })}
        emptyLabel={formatMessage({ defaultMessage: 'Aucun client API' })}
        fluid
        isLoading={isLoading}
        loadError={
          isError ? { isNextPage: false, isRetrying: isFetching, onRetry: () => void refetch() } : undefined
        }
        table={table}
      />

      {data && (
        <>
          <ApiClientCreationModal onClose={() => setCreating(false)} open={isCreating} scopes={data.scopes} />
          <ApiClientUpdateModal
            {...modalProps('update')}
            limitPerMinute={data.limitPerMinute}
            scopes={data.scopes}
          />
          <ApiClientChangesModal {...modalProps('changes')} />
          <ApiClientSecretRotationModal
            {...modalProps('rotation')}
            secretRotationDays={data.secretRotationDays}
          />
        </>
      )}
    </div>
  );
}
