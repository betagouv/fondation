import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons';
import Select from '@codegouvfr/react-dsfr/Select';
import { useId, useState, type FormEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTitleTakenBackWarning } from '../hooks/useTitleTakenBackWarning';
import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';
import { generatePassword } from '@/utils/password.utils';
import type { CreateUserDto } from '@api/types';
import { type AdminUserRoleEnum, useAdminUserRolesQuery } from '@queries/administration.queries';

import { GeneratedPasswordInput } from './GeneratedPasswordInput';

const NON_BLANK = '.*\\S.*';

function toCompleteUser(user: Partial<CreateUserDto> & { password: string }): CreateUserDto | null {
  const { email, firstName, gender, lastName, password, role } = user;
  if (!email?.trim() || !firstName?.trim() || !gender || !lastName?.trim() || !role) return null;

  return { email, firstName, gender, lastName, password, role };
}

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
  const [user, setUser] = useState<Partial<CreateUserDto> & { password: string }>(() => ({
    password: generatePassword(),
  }));
  const formId = useId();
  const titleTakenBack = useTitleTakenBackWarning(user.role, { enabled: props.open });
  const { data: roleGroups } = useAdminUserRolesQuery(user.gender, { enabled: props.open });
  const completeUser = toCompleteUser(user);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (completeUser) props.onSave(completeUser);
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
          <Button
            disabled={props.isSaving || !completeUser}
            nativeButtonProps={{ form: formId }}
            type="submit"
          >
            <FormattedMessage defaultMessage="Enregistrer" />
          </Button>
        </>
      }
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      size="large"
      title={formatMessage({ defaultMessage: 'Ajouter un utilisateur' })}
    >
      <form className="fr-mt-6v" id={formId} onSubmit={submit}>
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
        <div className="grid gap-x-6 md:grid-cols-2">
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
        </div>
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
          state={titleTakenBack ? 'info' : 'default'}
          stateRelatedMessage={titleTakenBack}
        >
          <option disabled hidden value="">
            {formatMessage({ defaultMessage: 'Sélectionner un rôle' })}
          </option>
          {roleGroups?.map((group) => (
            <optgroup key={group.id} label={group.label}>
              {group.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
        <GeneratedPasswordInput
          label={formatMessage({ defaultMessage: 'Mot de passe initial' })}
          onChange={(password) => setUser((current) => ({ ...current, password }))}
          password={user.password}
        />
      </form>
    </Modal>
  );
}
