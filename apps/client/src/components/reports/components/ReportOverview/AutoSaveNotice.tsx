import { useLocallyStoredState } from '@/hooks/useLocallyStoredState.hook';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Notice from '@codegouvfr/react-dsfr/Notice';
import clsx from 'clsx';

export const AutoSaveNotice: React.FC = () => {
  const [isVisible, setIsVisible] = useLocallyStoredState<boolean>({
    state: false,
    key: 'report.auto_save_alert_visible'
  });

  return (
    <Notice
      isClosable
      isClosed={!isVisible}
      onClose={() => setIsVisible(false)}
      title="L'enregistrement des modifications est automatique."
      className={clsx('w-full', cx('fr-px-4w', 'fr-py-3w'))}
    />
  );
};
