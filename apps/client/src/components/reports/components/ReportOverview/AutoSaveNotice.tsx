import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Notice from '@codegouvfr/react-dsfr/Notice';
import clsx from 'clsx';

export const AutoSaveNotice: React.FC = () => (
  <Notice
    isClosable
    title="L'enregistrement des modifications est automatique."
    className={clsx('w-full', cx('fr-px-4w', 'fr-py-3w'))}
  />
);
