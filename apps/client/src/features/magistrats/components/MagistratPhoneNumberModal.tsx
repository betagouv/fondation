import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useId, useState, type FormEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';

export function MagistratPhoneNumberModal(props: {
  hasFailed: boolean;
  initialPhoneNumber?: { label: string | null; number: string };
  isSaving: boolean;
  numberError: string | null;
  onClose: () => void;
  onClosed: () => void;
  onSave: (phoneNumber: { label: string | null; number: string }) => void;
  open: boolean;
  title: string;
}) {
  const { formatMessage } = useIntl();
  const [number, setNumber] = useState(props.initialPhoneNumber?.number ?? '');
  const [label, setLabel] = useState(props.initialPhoneNumber?.label ?? '');
  const formId = useId();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    props.onSave({ label: label.trim() || null, number: number.trim() });
  };

  return (
    <Modal
      actions={
        <>
          {props.hasFailed ? (
            <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
              <FormattedMessage defaultMessage="L'enregistrement a échoué" />
            </p>
          ) : null}
          <Button onClick={props.onClose} priority="secondary" type="button">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button
            disabled={props.isSaving || !number.trim()}
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
      title={props.title}
    >
      <form id={formId} onSubmit={submit}>
        <Input
          hintText={formatMessage({ defaultMessage: 'Par exemple : 06 12 34 56 78 ou +262 262 12 34 56' })}
          label={
            <RequiredLabel>
              <FormattedMessage defaultMessage="Numéro" />
            </RequiredLabel>
          }
          nativeInputProps={{
            autoComplete: 'off',
            onChange: (event) => setNumber(event.target.value),
            required: true,
            type: 'tel',
            value: number,
          }}
          state={props.numberError ? 'error' : 'default'}
          stateRelatedMessage={props.numberError}
        />
        <Input
          hintText={formatMessage({ defaultMessage: 'Par exemple : Portable, Conjointe, Domicile' })}
          label={<FormattedMessage defaultMessage="Étiquette" />}
          nativeInputProps={{
            maxLength: 50,
            onChange: (event) => setLabel(event.target.value),
            value: label,
          }}
        />
      </form>
    </Modal>
  );
}
