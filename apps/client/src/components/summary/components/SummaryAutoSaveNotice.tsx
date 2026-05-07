import Notice from '@codegouvfr/react-dsfr/Notice';

import { useLocallyStoredState } from '@/hooks/useLocallyStoredState.hook';
import { useSummary } from '@/pages/summary/SummaryContext';

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
      className="mb-12 rounded-lg border border-solid border-(--text-default-info)"
      title={`L'enregistrement des modifications est automatique`}
    />
  );
}
