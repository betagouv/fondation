import { createModal } from '@codegouvfr/react-dsfr/Modal';

export type SuccessModalConfig = {
  id: string;
  message?: string;
  title?: string;
};

export const createSuccessModal = ({ id, message, title = 'Succès' }: SuccessModalConfig) => {
  const modal = createModal({ id, isOpenedByDefault: false });

  const defaultMessage = "Données actualisées";

  const Component = () => (
    <modal.Component title={title}>
      <p>{message || defaultMessage}</p>
    </modal.Component>
  );

  return {
    open: modal.open,
    close: modal.close,
    Component
  };
};
