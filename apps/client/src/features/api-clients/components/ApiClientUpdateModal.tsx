import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import Input from '@codegouvfr/react-dsfr/Input';
import { useId, useState, type FormEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { allowedIpsOf } from '../utils/allowed-ips.utils';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';
import { ValidationError } from '@/utils/validation-error';
import type { ListedApiClientsDto, UpdateApiClientDto } from '@api/types';
import { useUpdateApiClientMutation } from '@queries/api-clients.queries';

type ListedApiClient = ListedApiClientsDto['items'][number];
type Scope = ListedApiClientsDto['scopes'][number];
type LimitBounds = ListedApiClientsDto['limitPerMinute'];

/** The client stays mounted for the fade out: the caller keeps it until onClosed */
export function ApiClientUpdateModal(props: {
  client: ListedApiClient | null;
  limitPerMinute: LimitBounds;
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
  scopes: readonly Scope[];
}) {
  const { formatMessage } = useIntl();
  const confirmation = useConfirmModal();
  const formId = useId();
  const update = useUpdateApiClientMutation();
  const close = () => {
    if (!update.isPending) props.onClose();
  };

  /** Without any IP, or any route, the partner can no longer call anything: asked before, when it still could */
  const confirmCutOff = async (client: ListedApiClient, body: UpdateApiClientDto) => {
    const losesIps = body.allowedIps.length === 0 && client.allowedIps.length > 0;
    const losesScopes = body.scopes.length === 0 && client.scopes.length > 0;
    if (!losesIps && !losesScopes) return true;

    const values = { name: client.name };
    const ips = {
      content: formatMessage({
        defaultMessage:
          "Sans adresse IP, le client sera refusé de partout jusqu'à ce qu'on lui en rende une.",
      }),
      i18n: { confirm: formatMessage({ defaultMessage: 'Retirer toutes les IP' }) },
      title: formatMessage({ defaultMessage: 'Retirer toutes les IP de « {name} » ?' }, values),
    };
    const scopes = {
      content: formatMessage({
        defaultMessage:
          "Sans route, le client ne pourra plus rien appeler jusqu'à ce qu'on lui en ouvre une.",
      }),
      i18n: { confirm: formatMessage({ defaultMessage: 'Retirer toutes les routes' }) },
      title: formatMessage({ defaultMessage: 'Retirer toutes les routes de « {name} » ?' }, values),
    };
    const both = {
      content: formatMessage({
        defaultMessage:
          "Sans adresse IP ni route, le client ne pourra plus rien appeler jusqu'à ce qu'on lui en rende.",
      }),
      i18n: { confirm: formatMessage({ defaultMessage: 'Tout retirer' }) },
      title: formatMessage(
        { defaultMessage: 'Retirer toutes les IP et toutes les routes de « {name} » ?' },
        values,
      ),
    };
    const { isConfirmed } = await confirmation.waitForConfirmation(
      losesIps && losesScopes ? both : losesIps ? ips : scopes,
    );

    return isConfirmed;
  };

  const submit = async (body: UpdateApiClientDto) => {
    const { client } = props;
    if (!client || !(await confirmCutOff(client, body))) return;
    update.mutate({ body, clientId: client.id }, { onSuccess: props.onClose });
  };

  return (
    <Modal
      actions={
        <>
          {update.isError && (
            <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
              {ValidationError.messageOf(update.error) ?? (
                <FormattedMessage defaultMessage="La modification a échoué" />
              )}
            </p>
          )}
          <Button disabled={update.isPending} onClick={close} priority="secondary" type="button">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={update.isPending} nativeButtonProps={{ form: formId }} type="submit">
            <FormattedMessage defaultMessage="Enregistrer" />
          </Button>
        </>
      }
      closeOnBackdrop={false}
      onClose={close}
      onClosed={() => {
        update.reset();
        props.onClosed();
      }}
      open={props.open}
      size="medium"
      title={formatMessage({ defaultMessage: 'Modifier « {name} »' }, { name: props.client?.name })}
    >
      {props.client && (
        <ApiClientUpdateForm
          client={props.client}
          id={formId}
          key={props.client.id}
          limitPerMinute={props.limitPerMinute}
          onSubmit={submit}
          scopes={props.scopes}
        />
      )}
    </Modal>
  );
}

/** Starts from what the client holds: a route opened here gets the limit a new client would */
function ApiClientUpdateForm(props: {
  client: ListedApiClient;
  id: string;
  limitPerMinute: LimitBounds;
  onSubmit: (body: UpdateApiClientDto) => void;
  scopes: readonly Scope[];
}) {
  const { formatMessage } = useIntl();
  const [ips, setIps] = useState(props.client.allowedIps.map(({ ip }) => ip).join('\n'));
  const [authLimit, setAuthLimit] = useState(props.client.authLimitPerMinute);
  const [limits, setLimits] = useState<Partial<Record<Scope['id'], number>>>(() =>
    Object.fromEntries(props.client.scopes.map(({ limitPerMinute, scope }) => [scope.id, limitPerMinute])),
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    props.onSubmit({
      allowedIps: allowedIpsOf(ips),
      authLimitPerMinute: authLimit,
      scopes: props.scopes.flatMap(({ id }) => {
        const limitPerMinute = limits[id];

        return limitPerMinute === undefined ? [] : [{ id, limitPerMinute }];
      }),
    });
  };

  return (
    <form className="fr-mt-6v" id={props.id} onSubmit={submit}>
      <Input
        hintText={formatMessage({ defaultMessage: 'Une adresse IPv4 ou IPv6 par ligne' })}
        label={formatMessage({ defaultMessage: 'Adresses IP autorisées' })}
        nativeTextAreaProps={{
          className: 'font-mono',
          onChange: (event) => setIps(event.target.value),
          rows: 3,
          value: ips,
        }}
        textArea
      />
      <LimitInput
        bounds={props.limitPerMinute}
        label={formatMessage({ defaultMessage: 'Authentification : appels par minute' })}
        onChange={setAuthLimit}
        value={authLimit}
      />
      <Checkbox
        legend={formatMessage({ defaultMessage: 'Routes autorisées' })}
        options={props.scopes.map((scope) => ({
          label: scope.label,
          nativeInputProps: {
            checked: limits[scope.id] !== undefined,
            onChange: (event) =>
              setLimits((current) => ({
                ...current,
                [scope.id]: event.target.checked ? scope.defaultLimitPerMinute : undefined,
              })),
            value: scope.id,
          },
        }))}
      />
      {props.scopes.map((scope) => {
        const limit = limits[scope.id];

        return (
          limit !== undefined && (
            <LimitInput
              bounds={props.limitPerMinute}
              key={scope.id}
              label={formatMessage({ defaultMessage: '{route} : appels par minute' }, { route: scope.label })}
              onChange={(value) => setLimits((current) => ({ ...current, [scope.id]: value }))}
              value={limit}
            />
          )
        );
      })}
    </form>
  );
}

function LimitInput(props: {
  bounds: LimitBounds;
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  const { formatMessage } = useIntl();

  return (
    <Input
      hintText={formatMessage({ defaultMessage: 'Entre {min} et {max}' }, props.bounds)}
      label={<RequiredLabel>{props.label}</RequiredLabel>}
      nativeInputProps={{
        max: props.bounds.max,
        min: props.bounds.min,
        onChange: (event) => props.onChange(event.target.valueAsNumber),
        required: true,
        step: 1,
        type: 'number',
        value: Number.isFinite(props.value) ? props.value : '',
      }}
    />
  );
}
