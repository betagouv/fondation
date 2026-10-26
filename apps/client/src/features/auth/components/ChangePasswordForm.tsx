import Alert from '@codegouvfr/react-dsfr/Alert';
import PasswordInput from '@codegouvfr/react-dsfr/blocks/PasswordInput';
import Button from '@codegouvfr/react-dsfr/Button';
import { useState, type SubmitEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useChangePasswordMutation, WrongCurrentPasswordError } from '@queries/auth.queries';

const MIN_LENGTH = 8;

export function ChangePasswordForm() {
  const { formatMessage } = useIntl();
  const { error, isPending, isSuccess, mutate: changePassword, reset } = useChangePasswordMutation();
  const [mismatch, setMismatch] = useState(false);
  const [tooShort, setTooShort] = useState(false);

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const field = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value.trim();

    reset();
    const newPassword = field('newPassword');
    const short = newPassword.length < MIN_LENGTH;
    const differs = newPassword !== field('confirmation');
    setTooShort(short);
    setMismatch(differs);
    if (short || differs) return;

    changePassword(
      { currentPassword: field('currentPassword'), newPassword },
      { onSuccess: () => form.reset() },
    );
  };

  return (
    <form onSubmit={onSubmit}>
      <h2 className="fr-h4">
        <FormattedMessage defaultMessage="Changer mon mot de passe" />
      </h2>
      <p className="fr-mb-6v text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Sur un autre ordinateur ou navigateur, il faudra vous reconnecter avec le nouveau mot de passe." />
      </p>

      {isSuccess && (
        <Alert
          className="fr-mb-6v"
          severity="success"
          small
          description={formatMessage({ defaultMessage: 'Votre mot de passe a été changé.' })}
        />
      )}
      {error && !(error instanceof WrongCurrentPasswordError) && (
        <Alert
          className="fr-mb-6v"
          severity="error"
          small
          description={formatMessage({
            defaultMessage: `Le mot de passe n'a pas pu être changé. Veuillez réessayer.`,
          })}
        />
      )}

      <div className="flex flex-col gap-6">
        <PasswordInput
          className="fr-mb-0"
          label={formatMessage({ defaultMessage: 'Mot de passe actuel' })}
          messages={
            error instanceof WrongCurrentPasswordError
              ? [
                  {
                    message: formatMessage({ defaultMessage: 'Le mot de passe actuel est incorrect' }),
                    severity: 'error',
                  },
                ]
              : []
          }
          messagesHint=""
          nativeInputProps={{ autoComplete: 'current-password', name: 'currentPassword', required: true }}
        />
        <PasswordInput
          className="fr-mb-0 [&_.fr-hint-text]:mt-1"
          hintText={formatMessage({ defaultMessage: '{count} caractères minimum' }, { count: MIN_LENGTH })}
          label={formatMessage({ defaultMessage: 'Nouveau mot de passe' })}
          messages={
            tooShort
              ? [
                  {
                    message: formatMessage(
                      {
                        defaultMessage:
                          'Le mot de passe doit contenir au moins {count} caractères, hors espaces au début et à la fin',
                      },
                      { count: MIN_LENGTH },
                    ),
                    severity: 'error',
                  },
                ]
              : []
          }
          messagesHint=""
          nativeInputProps={{
            autoComplete: 'new-password',
            name: 'newPassword',
            required: true,
          }}
        />
        <PasswordInput
          className="fr-mb-0"
          label={formatMessage({ defaultMessage: 'Confirmation du nouveau mot de passe' })}
          messages={
            mismatch
              ? [
                  {
                    message: formatMessage({ defaultMessage: 'Les deux mots de passe ne correspondent pas' }),
                    severity: 'error',
                  },
                ]
              : []
          }
          messagesHint=""
          nativeInputProps={{ autoComplete: 'new-password', name: 'confirmation', required: true }}
        />
        <div className="flex justify-end">
          <Button disabled={isPending} type="submit">
            <FormattedMessage defaultMessage="Changer mon mot de passe" />
          </Button>
        </div>
      </div>
    </form>
  );
}
