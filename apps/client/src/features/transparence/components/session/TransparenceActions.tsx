import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router';

import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useToasts } from '@/shared/ui/toast';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedNominationSessionDto } from '@api/types';
import {
  useArchiveNominationSessionMutation,
  useDeleteNominationSessionMutation,
} from '@queries/nomination-sessions.queries';

export function TransparenceActions(props: { transparence: DetailedNominationSessionDto }) {
  const { transparence } = props;
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const confirmation = useConfirmModal();
  const toasts = useToasts();

  const deleteSessionMutation = useDeleteNominationSessionMutation({ sessionId: transparence.id });
  const archiveSessionMutation = useArchiveNominationSessionMutation({ sessionId: transparence.id });

  const onArchive = async () => {
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
            <FormattedMessage defaultMessage={'Souhaitez-vous continuer ?'} />
          </p>
        </>
      ),
    });

    if (!isConfirmed) return;

    archiveSessionMutation.mutate(undefined, {
      onError: () =>
        toasts.error({
          description: formatMessage({
            defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
          }),
          title: formatMessage(
            { defaultMessage: `L'archivage de "{name}" a échoué` },
            { name: transparence.name },
          ),
        }),
      onSuccess: () => {
        navigate(ROUTE_PATHS.SG.MANAGE_SESSION);
        toasts.success({
          title: formatMessage(
            { defaultMessage: 'Transparence "{name}" archivée' },
            { name: transparence.name },
          ),
        });
      },
    });
  };

  const onDelete = async () => {
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
            <FormattedMessage defaultMessage={'Êtes-vous sûr de vouloir continuer ?'} />
          </p>
        </>
      ),
    });

    if (!isConfirmed) return;

    deleteSessionMutation.mutate(undefined, {
      onError: () =>
        toasts.error({
          description: formatMessage({
            defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
          }),
          title: formatMessage(
            { defaultMessage: `La suppression de "{name}" a échoué` },
            { name: transparence.name },
          ),
        }),
      onSuccess: () => {
        navigate(ROUTE_PATHS.SG.MANAGE_SESSION);
        toasts.success({
          title: formatMessage(
            { defaultMessage: 'Transparence "{name}" supprimée' },
            { name: transparence.name },
          ),
        });
      },
    });
  };

  const isMutationPending = deleteSessionMutation.isPending || archiveSessionMutation.isPending;

  const canArchive = transparence.isArchivable;
  const canDelete = !transparence.isValidated && transparence.isDeletable;

  return (
    <>
      {canArchive && (
        <Button
          aria-busy={archiveSessionMutation.isPending}
          className={clsx('min-h-9! py-1.5!', {
            "before:animate-spin before:content-['']": archiveSessionMutation.isPending,
          })}
          disabled={isMutationPending}
          iconId={archiveSessionMutation.isPending ? 'ri-loader-4-fill' : 'fr-icon-archive-line'}
          onClick={onArchive}
          priority="tertiary"
          size="small"
        >
          <FormattedMessage defaultMessage="Archiver" />
        </Button>
      )}

      {canDelete && (
        <Button
          aria-busy={deleteSessionMutation.isPending}
          className={clsx('min-h-9! py-1.5! text-(--text-default-error)!', {
            "before:animate-spin before:content-['']": deleteSessionMutation.isPending,
          })}
          disabled={isMutationPending}
          iconId={deleteSessionMutation.isPending ? 'ri-loader-4-fill' : 'ri-delete-bin-line'}
          onClick={onDelete}
          priority="tertiary"
          size="small"
        >
          <FormattedMessage defaultMessage="Supprimer" />
        </Button>
      )}
    </>
  );
}
