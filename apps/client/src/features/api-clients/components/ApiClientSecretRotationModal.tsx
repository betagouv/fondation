import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useId, useState, type FormEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { Modal } from '@/shared/ui/modal';
import { ValidationError } from '@/utils/validation-error';
import type { ListedApiClientsDto } from '@api/types';
import { useRotateApiClientSecretMutation } from '@queries/api-clients.queries';

import { ApiClientSecret } from './ApiClientSecret';

/**
 * The client stays mounted for the fade out: the caller keeps it until onClosed. It cannot be closed while the secret
 * is on its way, which the server never gives again
 */
export function ApiClientSecretRotationModal(props: {
  client: { id: string; name: string } | null;
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
  secretRotationDays: ListedApiClientsDto['secretRotationDays'];
}) {
  const { formatMessage } = useIntl();
  const dateAndTime = useDateAndTime();
  const formId = useId();
  const [days, setDays] = useState(props.secretRotationDays.default);
  const rotation = useRotateApiClientSecretMutation();
  const close = () => {
    if (!rotation.isPending) props.onClose();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (props.client) rotation.mutate({ clientId: props.client.id, days });
  };

  return (
    <Modal
      actions={
        rotation.data ? (
          <Button onClick={close}>
            <FormattedMessage defaultMessage="J'ai transmis le secret" />
          </Button>
        ) : (
          <>
            {rotation.isError && (
              <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
                {ValidationError.messageOf(rotation.error) ?? (
                  <FormattedMessage defaultMessage="La rotation a échoué" />
                )}
              </p>
            )}
            <Button disabled={rotation.isPending} onClick={close} priority="secondary" type="button">
              <FormattedMessage defaultMessage="Annuler" />
            </Button>
            <Button disabled={rotation.isPending} nativeButtonProps={{ form: formId }} type="submit">
              <FormattedMessage defaultMessage="Générer un nouveau secret" />
            </Button>
          </>
        )
      }
      closeOnBackdrop={false}
      onClose={close}
      onClosed={() => {
        rotation.reset();
        setDays(props.secretRotationDays.default);
        props.onClosed();
      }}
      open={props.open}
      size="medium"
      title={formatMessage(
        { defaultMessage: 'Faire tourner le secret de « {name} »' },
        { name: props.client?.name },
      )}
    >
      {rotation.data && props.client ? (
        <>
          <p>
            <FormattedMessage
              defaultMessage="L'ancien secret reste valide jusqu'au {date} à {time}, le temps que le partenaire passe au nouveau."
              values={dateAndTime(rotation.data.previousSecretValidUntil)}
            />
          </p>
          <ApiClientSecret clientId={props.client.id} secret={rotation.data.secret} />
        </>
      ) : (
        <form className="fr-mt-6v" id={formId} onSubmit={submit}>
          <Input
            hintText={formatMessage({
              defaultMessage: "Le partenaire garde l'accès avec l'ancien secret pendant ce délai",
            })}
            label={formatMessage({ defaultMessage: "Durée de validité de l'ancien secret (en jours)" })}
            nativeInputProps={{
              max: props.secretRotationDays.max,
              min: 1,
              onChange: (event) => setDays(event.target.valueAsNumber),
              required: true,
              step: 1,
              type: 'number',
              value: Number.isFinite(days) ? days : '',
            }}
          />
        </form>
      )}
    </Modal>
  );
}
