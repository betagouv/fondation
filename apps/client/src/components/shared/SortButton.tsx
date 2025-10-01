import Button from '@codegouvfr/react-dsfr/Button';
import type { FC } from 'react';

export type SortButtonProps = {
  iconId: 'fr-icon-arrow-down-line' | 'fr-icon-arrow-up-line';
  onClick: () => void;
  label: string;
};

export const SortButton: FC<SortButtonProps> = ({ iconId, onClick, label }) => {
  return (
    <Button
      iconId={iconId}
      onClick={onClick}
      className="fr-btn--icon-only p-0 hover:bg-transparent"
      priority="tertiary no outline"
      title={`Trier par ${label}`}
    />
  );
};
