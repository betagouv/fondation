import Notice from '@codegouvfr/react-dsfr/Notice';

import { useSummary } from '@/features/summary/context/SummaryContext';
import { useLocallyStoredState } from '@/shared/hooks/useLocallyStoredState.hook';

export function SummaryAutoSaveAlert() {
  const { canWriteSummary } = useSummary();
  const [isVisible, setIsVisible] = useLocallyStoredState<boolean>({
    state: canWriteSummary,
    key: 'summary.auto_save_alert_visible',
  });

  if (!canWriteSummary) return null;

  return (
    <Notice
      isClosable
      severity="info"
      onClose={() => setIsVisible(false)}
      isClosed={!isVisible}
      className="fr-mb-12v rounded-lg border border-solid border-(--text-default-info)"
      title={`L'enregistrement des modifications est automatique`}
    />
  );
}
