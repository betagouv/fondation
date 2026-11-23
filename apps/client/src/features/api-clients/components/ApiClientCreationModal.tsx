import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import Input from '@codegouvfr/react-dsfr/Input';
import { useId, useState, type FormEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { allowedIpsOf } from '../utils/allowed-ips.utils';
import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';
import { ValidationError } from '@/utils/validation-error';
import type { ListedApiClientsDto } from '@api/types';
import { useCreateApiClientMutation } from '@queries/api-clients.queries';

import { ApiClientSecret } from './ApiClientSecret';

const NON_BLANK = '.*\\S.*';

/** It cannot be closed while the secret is on its way, which the server never gives again */
export function ApiClientCreationModal(props: {
  onClose: () => void;
  open: boolean;
  scopes: ListedApiClientsDto['scopes'];
}) {
  const { formatMessage } = useIntl();
  const formId = useId();
  const [name, setName] = useState('');
  const [ips, setIps] = useState('');
  const [scopeIds, setScopeIds] = useState<ListedApiClientsDto['scopes'][number]['id'][]>([]);
  const creation = useCreateApiClientMutation();
  const allowedIps = allowedIpsOf(ips);
  const close = () => {
    if (!creation.isPending) props.onClose();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    creation.mutate({
      allowedIps,
      name,
      scopes: scopeIds.map((id) => ({ id })),
    });
  };

  return (
    <Modal
      actions={
        creation.data ? (
          <Button onClick={close}>
            <FormattedMessage defaultMessage="J'ai transmis le secret" />
          </Button>
        ) : (
          <>
            {creation.isError && (
              <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
                {ValidationError.messageOf(creation.error) ?? (
                  <FormattedMessage defaultMessage="La création a échoué" />
                )}
              </p>
            )}
            <Button disabled={creation.isPending} onClick={close} priority="secondary" type="button">
              <FormattedMessage defaultMessage="Annuler" />
            </Button>
            <Button
              disabled={
                creation.isPending || !name.trim() || allowedIps.length === 0 || scopeIds.length === 0
              }
              nativeButtonProps={{ form: formId }}
              type="submit"
            >
              <FormattedMessage defaultMessage="Créer" />
            </Button>
          </>
        )
      }
      closeOnBackdrop={false}
      onClose={close}
      onClosed={() => {
        creation.reset();
        setName('');
        setIps('');
        setScopeIds([]);
      }}
      open={props.open}
      size="medium"
      title={formatMessage({ defaultMessage: 'Créer un client API' })}
    >
      {creation.data ? (
        <ApiClientSecret clientId={creation.data.id} secret={creation.data.secret} />
      ) : (
        <form className="fr-mt-6v" id={formId} onSubmit={submit}>
          <Input
            label={
              <RequiredLabel>
                <FormattedMessage defaultMessage="Nom" />
              </RequiredLabel>
            }
            nativeInputProps={{
              autoComplete: 'off',
              onChange: (event) => setName(event.target.value),
              pattern: NON_BLANK,
              required: true,
              value: name,
            }}
          />
          <Input
            hintText={formatMessage({ defaultMessage: 'Une adresse IPv4 ou IPv6 par ligne' })}
            label={
              <RequiredLabel>
                <FormattedMessage defaultMessage="Adresses IP autorisées" />
              </RequiredLabel>
            }
            nativeTextAreaProps={{
              className: 'font-mono',
              onChange: (event) => setIps(event.target.value),
              required: true,
              rows: 3,
              value: ips,
            }}
            textArea
          />
          <Checkbox
            legend={
              <RequiredLabel>
                <FormattedMessage defaultMessage="Routes autorisées" />
              </RequiredLabel>
            }
            options={props.scopes.map((scope) => ({
              label: scope.label,
              nativeInputProps: {
                checked: scopeIds.includes(scope.id),
                onChange: (event) =>
                  setScopeIds((current) =>
                    event.target.checked ? [...current, scope.id] : current.filter((id) => id !== scope.id),
                  ),
                value: scope.id,
              },
            }))}
          />
        </form>
      )}
    </Modal>
  );
}
