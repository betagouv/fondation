import { colors } from '@codegouvfr/react-dsfr';
import clsx from 'clsx';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router';

import { useArchivedSession } from '@/shared/context/archived-session';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/shared/ui/menu';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedNominationSessionDto } from '@api/types';
import {
  useArchiveNominationSessionMutation,
  useDeleteNominationSessionMutation,
} from '@queries/nomination-sessions.queries';

export function TransparenceActionsMenu(props: { transparence: DetailedNominationSessionDto }) {
  const { transparence } = props;
  const { formatMessage } = useIntl();
  const { isArchived } = useArchivedSession();
  const navigate = useNavigate();
  const confirmation = useConfirmModal();

  const deleteSessionMutation = useDeleteNominationSessionMutation({ sessionId: transparence.id });
  const archiveSessionMutation = useArchiveNominationSessionMutation({ sessionId: transparence.id });

  const onArchive = useCallback(async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: formatMessage({ defaultMessage: `Confirmer l'archivage` }),
      content: (
        <>
          <p>
            <FormattedMessage
              defaultMessage={'Vous allez archiver la transparence "{name}".'}
              values={{ name: transparence.name }}
            />
          </p>
          <p>
            <FormattedMessage defaultMessage={'Souhaitez-vous continuer\u00A0?'} />
          </p>
        </>
      ),
    });

    if (!isConfirmed) return;

    archiveSessionMutation.mutate(undefined, {
      onSuccess: () => navigate(ROUTE_PATHS.SG.MANAGE_SESSION),
    });
  }, [archiveSessionMutation, confirmation, formatMessage, navigate, transparence.name]);

  const onDelete = useCallback(async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: formatMessage({ defaultMessage: 'Confirmer la suppression' }),
      content: (
        <>
          <p>
            <FormattedMessage
              defaultMessage={'Vous allez supprimer la transparence "{name}".'}
              values={{ name: transparence.name }}
            />
          </p>
          <p>
            <FormattedMessage
              defaultMessage={"Une fois confirmé, <bold>il est impossible d'annuler la suppression.</bold>"}
              values={{ bold: (label) => <strong className="font-bold">{label}</strong> }}
            />
          </p>
          <p>
            <FormattedMessage defaultMessage={'Êtes-vous sûr de vouloir continuer\u00A0?'} />
          </p>
        </>
      ),
    });

    if (!isConfirmed) return;

    deleteSessionMutation.mutate(undefined, {
      onSuccess: () => navigate(ROUTE_PATHS.SG.MANAGE_SESSION),
    });
  }, [confirmation, deleteSessionMutation, formatMessage, navigate, transparence.name]);

  const isMutationPending = deleteSessionMutation.isPending || archiveSessionMutation.isPending;

  const canArchive = transparence.isArchivable;
  const canDelete = !isArchived && transparence.isDeletable;
  if (!canArchive && !canDelete) return null;

  return (
    <MenuRoot disabled={isMutationPending}>
      <MenuTrigger
        className={clsx('shrink-0 grow-0 rounded-full', {
          "before:animate-spin before:content-['']": isMutationPending,
        })}
        disabled={isMutationPending}
        iconId={isMutationPending ? 'ri-loader-4-line' : 'ri-more-2-fill'}
        priority="tertiary no outline"
        size="small"
        title={formatMessage(
          { defaultMessage: 'Actions sur la transparence "{name}"' },
          { name: transparence.name },
        )}
      />

      <MenuContent>
        {canArchive && (
          <MenuItem
            className={clsx({
              "before:animate-spin before:content-['']": archiveSessionMutation.isPending,
            })}
            disabled={isMutationPending}
            iconId={archiveSessionMutation.isPending ? 'ri-loader-4-fill' : 'fr-icon-archive-fill'}
            onClick={onArchive}
            style={{ color: colors.decisions.text.actionHigh.yellowTournesol.default }}
          >
            <FormattedMessage defaultMessage="Archiver" />
          </MenuItem>
        )}

        {canDelete && (
          <MenuItem
            className={clsx('before text-(--text-default-error)', {
              "before:animate-spin before:content-['']": deleteSessionMutation.isPending,
            })}
            disabled={isMutationPending}
            iconId={deleteSessionMutation.isPending ? `ri-loader-4-fill` : 'ri-delete-bin-fill'}
            onClick={onDelete}
          >
            <FormattedMessage defaultMessage="Supprimer" />
          </MenuItem>
        )}
      </MenuContent>
    </MenuRoot>
  );
}
