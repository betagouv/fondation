import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage, useIntl } from 'react-intl';

import { Modal } from '@/shared/ui/modal';
import { formatPhoneNumber } from '@/utils/string.utils';

export function MagistratPhoneNumberDeleteModal(props: {
  hasFailed: boolean;
  isDeleting: boolean;
  number: string;
  onClose: () => void;
  onClosed: () => void;
  onDelete: () => void;
  open: boolean;
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
      title={formatMessage({ defaultMessage: 'Supprimer un numéro' })}
    >
      <p className="fr-mb-0">
        <FormattedMessage
          defaultMessage="Le numéro {number} sera définitivement supprimé."
          values={{ number: formatPhoneNumber(props.number) }}
        />
      </p>
    </Modal>
  );
}
