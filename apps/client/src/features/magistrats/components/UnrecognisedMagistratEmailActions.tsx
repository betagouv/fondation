import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage, useIntl } from 'react-intl';

import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useToasts } from '@/shared/ui/toast';
import { ValidationError } from '@/utils/validation-error';
import {
  type UnrecognisedMagistratEmail,
  useDismissUnrecognisedMagistratEmailMutation,
} from '@queries/magistrats.queries';

export function UnrecognisedMagistratEmailActions(props: {
  email: UnrecognisedMagistratEmail;
  onAttach: () => void;
  onDismissed: () => void;
}) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const { waitForConfirmation } = useConfirmModal();
  const dismiss = useDismissUnrecognisedMagistratEmailMutation();

  const confirmDismissal = async () => {
    const { isConfirmed } = await waitForConfirmation({
      content: (
        <p className="fr-mb-0">
          <FormattedMessage
            defaultMessage="L'adresse {email} ne sera plus proposée. Elle reviendra si le site du CSM la demande de nouveau."
            values={{ email: <strong>{props.email.email}</strong> }}
          />
        </p>
      ),
      i18n: { confirm: formatMessage({ defaultMessage: 'Écarter' }) },
      title: formatMessage({ defaultMessage: "Écarter l'adresse ?" }),
    });
    if (!isConfirmed) return;

    dismiss.mutate(props.email.id, {
      onError: (error) =>
        toasts.error({
          description:
            ValidationError.messageOf(error) ??
            formatMessage({ defaultMessage: 'Réessayez et prévenez le support si cela persiste.' }),
          title: formatMessage({ defaultMessage: "L'adresse n'a pas été écartée" }),
        }),
      onSuccess: () => {
        toasts.success({ title: formatMessage({ defaultMessage: "L'adresse a été écartée" }) });
        props.onDismissed();
      },
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        nativeButtonProps={{
          'aria-label': formatMessage({ defaultMessage: 'Rattacher {email}' }, { email: props.email.email }),
        }}
        onClick={props.onAttach}
        size="small"
      >
        <FormattedMessage defaultMessage="Rattacher" />
      </Button>
      <Button
        disabled={dismiss.isPending}
        nativeButtonProps={{
          'aria-label': formatMessage({ defaultMessage: 'Écarter {email}' }, { email: props.email.email }),
        }}
        onClick={() => void confirmDismissal()}
        priority="secondary"
        size="small"
      >
        <FormattedMessage defaultMessage="Écarter" />
      </Button>
    </div>
  );
}
