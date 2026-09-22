import { useCallback, useContext, useMemo, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useConfirmModal } from '@/shared/context/confirm-modal';
import { IconButton } from '@/shared/ui/icon-button';
import { ACTION_ICONS } from '@/shared/ui/icons';
import { useToasts } from '@/shared/ui/toast';
import type { FoundSessionDocsDto } from '@api/types';
import { useDeleteAgenda, useDeleteOfficialReportMutation } from '@queries/agenda.queries';

import type { SessionDocument } from './session-document-groups';
import { SessionDocumentsTableContext, type Association } from './SessionDocumentsTable';

/** everything a deletion carries away besides the document itself, in the order it matters */
function deletionConsequences(query: {
  association: Association | undefined;
  doc: SessionDocument;
}): { key: string; message: ReactNode }[] {
  const { association, doc } = query;
  if (doc.type !== 'agenda') return [];

  const officialReport = association?.associated.find((other) => other.type === 'officialReport');
  const otherAgendas = (association?.agendasCount ?? 1) - 1;
  const consequences: { key: string; message: ReactNode }[] = [];

  if (doc.officialReportId) {
    consequences.push({
      key: 'official-report',
      message:
        officialReport?.status === 'VALIDATED' ? (
          <FormattedMessage defaultMessage="Le PV lié est validé et sera supprimé." />
        ) : (
          <FormattedMessage defaultMessage="Cela entraînera la suppression du PV lié." />
        ),
    });

    if (otherAgendas > 0) {
      consequences.push({
        key: 'other-agendas',
        message: (
          <FormattedMessage
            defaultMessage="Ce PV couvre {count, plural, one {un autre ordre du jour qui perdra} other {# autres ordres du jour qui perdront}} le sien."
            values={{ count: otherAgendas }}
          />
        ),
      });
    }
  }

  if (doc.hasPresentationPlan) {
    consequences.push({
      key: 'presentation-plan',
      message: <FormattedMessage defaultMessage="La notice de restitution liée sera supprimée elle aussi." />,
    });
  }

  return consequences;
}

export function DocActionDelete(props: {
  disabled: boolean;
  doc: FoundSessionDocsDto['items'][number];
  sessionId: string;
}) {
  const { doc, disabled, sessionId } = props;

  const { formatMessage } = useIntl();
  const confirmation = useConfirmModal();
  const toasts = useToasts();
  const { mutate: deleteAgenda, isPending: isDeletingAgenda } = useDeleteAgenda(sessionId);
  const { mutate: deleteOfficialReport, isPending: isDeletingOfficialReport } =
    useDeleteOfficialReportMutation(sessionId);

  const { associations } = useContext(SessionDocumentsTableContext);
  const consequences = useMemo(
    () => deletionConsequences({ association: associations?.get(doc.id), doc }),
    [associations, doc],
  );

  const onDeleteDoc = useCallback(async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: formatMessage({ defaultMessage: 'Confirmer la suppression de "{name}"' }, { name: doc.name }),
      content: (
        <>
          <p>
            <FormattedMessage
              defaultMessage='Voulez-vous vraiment supprimer le document "{name}"&nbsp;?'
              values={{ name: doc.name }}
            />
          </p>
          {consequences.map(({ key, message }) => (
            <p className="font-bold" key={key}>
              {message}
            </p>
          ))}
        </>
      ),
    });

    if (!isConfirmed) {
      return;
    }

    const onError = () =>
      toasts.error({
        description: formatMessage({
          defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
        }),
        title: formatMessage({ defaultMessage: 'La suppression de "{name}" a échoué' }, { name: doc.name }),
      });

    return doc.type === 'agenda'
      ? deleteAgenda({ agendaId: doc.id }, { onError })
      : deleteOfficialReport({ officialReportId: doc.id }, { onError });
  }, [confirmation, consequences, doc, deleteAgenda, deleteOfficialReport, formatMessage, toasts]);

  return (
    <IconButton
      disabled={isDeletingAgenda || isDeletingOfficialReport || disabled}
      iconId={ACTION_ICONS.delete}
      label={formatMessage({ defaultMessage: 'Supprimer {name}' }, { name: doc.name })}
      onClick={onDeleteDoc}
      small
    />
  );
}
