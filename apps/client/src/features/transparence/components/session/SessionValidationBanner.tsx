import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage, useIntl } from 'react-intl';

import { useConfirmation } from '@/shared/context/confirmation';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { useUser } from '@queries/auth.queries';
import { useValidateSessionMutation } from '@queries/nomination-sessions.queries';

export function SessionValidationBanner(props: { session: { id: string; isValidated: boolean } }) {
  const { formatMessage } = useIntl();
  const { user } = useUser();
  const confirmation = useConfirmation();
  const { mutate: validateSession, isError, isPending } = useValidateSessionMutation();

  const onValidate = async () => {
    if (!user) return;

    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: formatMessage({ defaultMessage: 'Valider les données de la session\u00A0?' }),
      content: (
        <p>
          <FormattedMessage
            defaultMessage={
              'La session ne sera plus signalée comme nouvelle, ici et dans "Gérer une session".' +
              ' Aucune donnée n\u2019est modifiée.'
            }
          />
        </p>
      ),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Annuler' }),
        confirm: formatMessage({ defaultMessage: 'Valider les données' }),
      },
    });

    if (!isConfirmed) return;

    validateSession({ sessionId: props.session.id, userId: user.id });
  };

  if (props.session.isValidated) return null;

  return (
    <AlertBanner
      align="center"
      className="fr-py-2v mx-[calc(50%-50vw)] justify-center px-[calc(50vw-50%)]"
      icon="fr-icon-warning-fill"
      message={
        <FormattedMessage
          defaultMessage="<b>Nouvelle session</b>, les données n'ont pas encore été validées"
          values={{ b: (chunks) => <strong>{chunks}</strong> }}
        />
      }
      tone="warning"
    >
      <Button
        disabled={isPending}
        nativeButtonProps={confirmation.buttonProps}
        onClick={onValidate}
        priority="tertiary no outline"
        size="small"
      >
        <FormattedMessage defaultMessage="Valider les données" />
      </Button>

      {isError && (
        <span>
          <FormattedMessage defaultMessage="La validation a échoué, réessayez." />
        </span>
      )}
    </AlertBanner>
  );
}
