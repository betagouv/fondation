import Button from '@codegouvfr/react-dsfr/Button';
import { useId, useState, type FormEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { MagistratCombobox } from '@/features/observations/components/MagistratCombobox';
import { Modal } from '@/shared/ui/modal';
import { useToasts } from '@/shared/ui/toast';
import { ValidationError } from '@/utils/validation-error';
import {
  type UnrecognisedMagistratEmail,
  useAttachUnrecognisedMagistratEmailMutation,
} from '@queries/magistrats.queries';
import type { Observant } from '@queries/observations.queries';

export function AttachUnrecognisedMagistratEmailModal(props: {
  email: UnrecognisedMagistratEmail;
  onAttached: () => void;
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
}) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const formId = useId();
  const attach = useAttachUnrecognisedMagistratEmailMutation();
  const [magistrat, setMagistrat] = useState<Observant | null>(null);
  const refusal = ValidationError.messageOf(attach.error);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!magistrat) return;

    attach.mutate(
      { id: props.email.id, magistratId: magistrat.id },
      {
        onSuccess: () => {
          toasts.success({
            title: formatMessage(
              { defaultMessage: "L'adresse a été rattachée à {name}" },
              { name: magistrat.name },
            ),
          });
          props.onAttached();
          props.onClose();
        },
      },
    );
  };

  return (
    <Modal
      actions={
        <>
          {(refusal || ValidationError.isOtherFailure(attach.error)) && (
            <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
              {refusal ?? <FormattedMessage defaultMessage="Le rattachement a échoué, réessayez" />}
            </p>
          )}
          <Button onClick={props.onClose} priority="secondary" type="button">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button
            disabled={attach.isPending || !magistrat}
            nativeButtonProps={{ form: formId }}
            type="submit"
          >
            <FormattedMessage defaultMessage="Rattacher" />
          </Button>
        </>
      }
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      size="medium"
      title={formatMessage({ defaultMessage: "Rattacher l'adresse à un magistrat" })}
    >
      <form className="fr-mt-6v flex flex-col gap-6" id={formId} onSubmit={submit}>
        <p className="fr-mb-0">
          <FormattedMessage
            defaultMessage="Le site du CSM reconnaîtra ce magistrat à l'adresse {email}."
            values={{ email: <strong>{props.email.email}</strong> }}
          />
        </p>
        <MagistratCombobox
          hint={<FormattedMessage defaultMessage="Nom ou prénom" />}
          inShortModal
          label={<FormattedMessage defaultMessage="Magistrat" />}
          magistrat={magistrat}
          onChange={setMagistrat}
        />
      </form>
    </Modal>
  );
}
