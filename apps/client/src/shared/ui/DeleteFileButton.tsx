import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { ACTION_ICONS } from '@/constants/icons.constants';
import { useConfirmation } from '@/shared/context/confirmation';
import { IconButton } from '@/shared/ui/icon-button';

export function DeleteFileButton(props: { fileName: string; onDelete: () => void }) {
  const { formatMessage } = useIntl();
  const confirmation = useConfirmation();

  const onDelete = useCallback(async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: formatMessage({ defaultMessage: 'Confirmer la suppression du fichier' }),
      content: (
        <p>
          <FormattedMessage
            defaultMessage="Confirmez-vous la suppression du fichier: <strong>«&nbsp;{fileName}&nbsp;»</strong>"
            values={{
              fileName: props.fileName,
              strong: (chunks) => <strong>{chunks}</strong>,
            }}
          />
        </p>
      ),
    });

    if (isConfirmed) props.onDelete();
  }, [props, confirmation, formatMessage]);

  return (
    <IconButton
      {...confirmation.buttonProps}
      iconId={ACTION_ICONS.delete}
      label={formatMessage({ defaultMessage: 'Supprimer {fileName}' }, { fileName: props.fileName })}
      onClick={onDelete}
    />
  );
}
