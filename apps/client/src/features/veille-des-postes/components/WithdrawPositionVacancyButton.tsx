import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage, useIntl } from 'react-intl';

import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useToasts } from '@/shared/ui/toast';
import { useWithdrawPositionVacancyMutation } from '@queries/veille-des-postes.queries';

export function WithdrawPositionVacancyButton(props: { magistratId: string }) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const { waitForConfirmation } = useConfirmModal();
  const withdraw = useWithdrawPositionVacancyMutation();

  const confirmAndWithdraw = async () => {
    const { isConfirmed } = await waitForConfirmation({
      content: formatMessage({
        defaultMessage:
          'Le poste reprendra le statut déduit des données LOLFI. Le motif, la date et les justificatifs seront supprimés.',
      }),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Annuler' }),
        confirm: formatMessage({ defaultMessage: 'Réinitialiser le statut' }),
      },
      title: formatMessage({ defaultMessage: 'Réinitialiser le statut ?' }),
    });
    if (!isConfirmed) return;

    withdraw.mutate(
      { magistratId: props.magistratId },
      {
        onError: () =>
          toasts.error({
            title: formatMessage({ defaultMessage: "Le statut n'a pas pu être réinitialisé" }),
          }),
      },
    );
  };

  return (
    <Button disabled={withdraw.isPending} onClick={confirmAndWithdraw} priority="tertiary" size="small">
      <FormattedMessage defaultMessage="Réinitialiser le statut" />
    </Button>
  );
}
