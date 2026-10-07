import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage, useIntl } from 'react-intl';

import { Modal } from '@/shared/ui/modal';
import { formatPhoneNumber } from '@/utils/string.utils';

export function MagistratPhoneNumberDeleteModal(props: {
  hasFailed: boolean;
  isDeleting: boolean;
  magistratName: string;
  onClose: () => void;
  onClosed: () => void;
  onDelete: () => void;
  open: boolean;
  phoneNumber: { label: string | null; number: string };
}) {
  const { formatMessage } = useIntl();

  return (
    <Modal
      actions={
        <>
          {props.hasFailed ? (
            <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
              <FormattedMessage defaultMessage="La suppression a échoué" />
            </p>
          ) : null}
          <Button onClick={props.onClose} priority="secondary">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={props.isDeleting} onClick={props.onDelete}>
            <FormattedMessage defaultMessage="Supprimer" />
          </Button>
        </>
      }
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      title={formatMessage({ defaultMessage: 'Supprimer le numéro' })}
    >
      <p className="fr-mb-0">
        <FormattedMessage
          defaultMessage="Le numéro {number}{label, select, none {} other { ({label})}} de {name} sera définitivement supprimé."
          values={{
            label: props.phoneNumber.label ?? 'none',
            name: props.magistratName,
            number: formatPhoneNumber(props.phoneNumber.number),
          }}
        />
      </p>
    </Modal>
  );
}
