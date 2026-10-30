import Alert from '@codegouvfr/react-dsfr/Alert';
import PasswordInput from '@codegouvfr/react-dsfr/blocks/PasswordInput';
import Button from '@codegouvfr/react-dsfr/Button';
import { useState, type SubmitEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { isStrongPassword, passwordRuleStates } from '@/utils/password.utils';
import { ValidationError } from '@/utils/validation-error';
import { useChangePasswordMutation } from '@queries/auth.queries';

export function ChangePasswordForm() {
  const { formatMessage } = useIntl();
  const { error, isPending, isSuccess, mutate: changePassword, reset } = useChangePasswordMutation();
  const [mismatch, setMismatch] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitted, setSubmitted] = useState(false);

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const field = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value.trim();

    reset();
    const differs = newPassword.trim() !== field('confirmation');
    setSubmitted(true);
    setMismatch(differs);
    if (!isStrongPassword(newPassword) || differs) return;

    changePassword(
      { currentPassword: field('currentPassword'), newPassword: newPassword.trim() },
      {
        onSuccess: () => {
          form.reset();
          setNewPassword('');
          setSubmitted(false);
        },
      },
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
          description={formatMessage({ defaultMessage: 'Votre mot de passe a été changé.' })}
          severity="success"
          small
        />
      )}
      {error && !(error instanceof ValidationError) && (
        <Alert
          className="fr-mb-6v"
          description={formatMessage({
            defaultMessage: `Le mot de passe n'a pas pu être changé. Veuillez réessayer.`,
          })}
          severity="error"
          small
        />
      )}

      <div className="flex flex-col gap-6">
        <PasswordInput
          className="fr-mb-0"
          label={formatMessage({ defaultMessage: 'Mot de passe actuel' })}
          messages={error instanceof ValidationError ? [{ message: error.message, severity: 'error' }] : []}
          messagesHint=""
          nativeInputProps={{ autoComplete: 'current-password', name: 'currentPassword', required: true }}
        />
        <PasswordInput
          className="fr-mb-0"
          label={formatMessage({ defaultMessage: 'Nouveau mot de passe' })}
          messages={passwordRuleStates(newPassword, isSubmitted).map((rule) => ({
            ...rule,
            message: formatMessage(rule.message),
          }))}
          messagesHint={formatMessage({ defaultMessage: 'Votre mot de passe doit contenir :' })}
          nativeInputProps={{
            autoComplete: 'new-password',
            name: 'newPassword',
            onChange: (event) => setNewPassword(event.target.value),
            required: true,
            value: newPassword,
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
