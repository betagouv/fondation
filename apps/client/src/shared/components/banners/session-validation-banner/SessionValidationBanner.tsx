import { colors } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { PermanentBanner } from '../PermanentBanner';
import { useConfirmation } from '@/shared/context/confirmation';
import { useSessionValidation } from '@/shared/context/session-validation';
import { useUser } from '@queries/auth.queries';
import { useValidateSessionMutation } from '@queries/nomination-sessions.queries';

const bgColor = colors.decisions.background.contrast.warning.default;
const text = colors.decisions.text.default.warning.default;

export function SessionValidationBanner() {
  const { formatMessage } = useIntl();
  const { user } = useUser();
  const confirmation = useConfirmation();
  const { sessionToValidate, setSessionToValidate } = useSessionValidation();
  const { mutate: validateSession, isError, isPending } = useValidateSessionMutation();

  const onValidate = useCallback(async () => {
    if (!user || !sessionToValidate) return;

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

    validateSession(
      { sessionId: sessionToValidate.id, userId: user.id },
      { onSuccess: () => setSessionToValidate(null) },
    );
  }, [confirmation, formatMessage, sessionToValidate, setSessionToValidate, user, validateSession]);

  if (!sessionToValidate) return null;

  return (
    <PermanentBanner className="flex items-center gap-x-2" style={{ color: text, backgroundColor: bgColor }}>
      <span>
        <FormattedMessage
          defaultMessage="<b>Nouvelle session</b>, les données n'ont pas encore été validées"
          values={{ b: (chunks) => <strong>{chunks}</strong> }}
        />
      </span>

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
    </PermanentBanner>
  );
}
