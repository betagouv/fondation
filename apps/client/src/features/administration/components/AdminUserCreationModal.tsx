import PasswordInput from '@codegouvfr/react-dsfr/blocks/PasswordInput';
import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons';
import Select from '@codegouvfr/react-dsfr/Select';
import { useId, useState, type FormEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { ROLE_OPTIONS, type AdminUserRoleEnum } from '../labels/admin-user-enum';
import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';
import { isStrongPassword, passwordRuleStates } from '@/utils/password.utils';
import type { CreateUserDto } from '@api/types';

const NON_BLANK = '.*\\S.*';

export function AdminUserCreationModal(props: {
  emailError: string | null;
  hasFailed: boolean;
  isSaving: boolean;
  onClose: () => void;
  onClosed: () => void;
  onSave: (user: CreateUserDto) => void;
  open: boolean;
}) {
  const { formatMessage } = useIntl();
  const [user, setUser] = useState<Partial<CreateUserDto>>({});
  const [isSubmitted, setSubmitted] = useState(false);
  const formId = useId();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const { email, firstName, gender, lastName, password, role } = user;
    if (!email || !firstName || !gender || !lastName || !password || !isStrongPassword(password) || !role)
      return;

    props.onSave({ email, firstName, gender, lastName, password, role });
  };

  return (
    <Modal
      actions={
        <>
          {props.hasFailed ? (
            <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
              <FormattedMessage defaultMessage="La création a échoué" />
            </p>
          ) : null}
          <Button onClick={props.onClose} priority="secondary" type="button">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={props.isSaving} nativeButtonProps={{ form: formId }} type="submit">
            <FormattedMessage defaultMessage="Créer le compte" />
          </Button>
        </>
      }
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      title={formatMessage({ defaultMessage: 'Créer un compte' })}
    >
      <form id={formId} onSubmit={submit}>
        <RadioButtons
          legend={
            <RequiredLabel>
              <FormattedMessage defaultMessage="Civilité" />
            </RequiredLabel>
          }
          name="gender"
          options={(['FEMALE', 'MALE'] as const).map((gender) => ({
            label:
              gender === 'FEMALE'
                ? formatMessage({ defaultMessage: 'Madame' })
                : formatMessage({ defaultMessage: 'Monsieur' }),
            nativeInputProps: {
              checked: user.gender === gender,
              onChange: () => setUser((current) => ({ ...current, gender })),
              required: true,
              value: gender,
            },
          }))}
          orientation="horizontal"
        />
        <Input
          label={
            <RequiredLabel>
              <FormattedMessage defaultMessage="Prénom" />
            </RequiredLabel>
          }
          nativeInputProps={{
            autoComplete: 'off',
            onChange: (event) => setUser((current) => ({ ...current, firstName: event.target.value })),
            pattern: NON_BLANK,
            required: true,
            value: user.firstName ?? '',
          }}
        />
        <Input
          label={
            <RequiredLabel>
              <FormattedMessage defaultMessage="Nom" />
            </RequiredLabel>
          }
          nativeInputProps={{
            autoComplete: 'off',
            onChange: (event) => setUser((current) => ({ ...current, lastName: event.target.value })),
            pattern: NON_BLANK,
            required: true,
            value: user.lastName ?? '',
          }}
        />
        <Input
          label={
            <RequiredLabel>
              <FormattedMessage defaultMessage="Email" />
            </RequiredLabel>
          }
          nativeInputProps={{
            autoComplete: 'off',
            onChange: (event) => setUser((current) => ({ ...current, email: event.target.value })),
            required: true,
            type: 'email',
            value: user.email ?? '',
          }}
          state={props.emailError ? 'error' : 'default'}
          stateRelatedMessage={props.emailError}
        />
        <Select
          label={
            <RequiredLabel>
              <FormattedMessage defaultMessage="Rôle" />
            </RequiredLabel>
          }
          nativeSelectProps={{
            onChange: (event) =>
              setUser((current) => ({ ...current, role: event.target.value as AdminUserRoleEnum })),
            required: true,
            value: user.role ?? '',
          }}
        >
          <option disabled hidden value="">
            {formatMessage({ defaultMessage: 'Sélectionner un rôle' })}
          </option>
          {ROLE_OPTIONS.map((group) => {
            const groupLabel = formatMessage(group.label);
            return (
              <optgroup key={groupLabel} label={groupLabel}>
                {group.options.map(({ id, label }) => (
                  <option key={id} value={id}>
                    {formatMessage(label, { gender: user.gender })}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </Select>
        <PasswordInput
          hintText={formatMessage({ defaultMessage: 'À transmettre hors de Fondation' })}
          label={
            <RequiredLabel>
              <FormattedMessage defaultMessage="Mot de passe initial" />
            </RequiredLabel>
          }
          messages={passwordRuleStates(user.password ?? '', isSubmitted).map((rule) => ({
            ...rule,
            message: formatMessage(rule.message),
          }))}
          messagesHint={formatMessage({ defaultMessage: 'Le mot de passe doit contenir :' })}
          nativeInputProps={{
            autoComplete: 'new-password',
            onChange: (event) => setUser((current) => ({ ...current, password: event.target.value })),
            required: true,
            value: user.password ?? '',
          }}
        />
      </form>
    </Modal>
  );
}
