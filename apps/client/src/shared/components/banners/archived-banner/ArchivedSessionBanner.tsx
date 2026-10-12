import { colors } from '@codegouvfr/react-dsfr';

import { PermanentBanner } from '../PermanentBanner';
import { useArchivedSession } from '@/shared/context/archived-session';

const bgColor = colors.decisions.background.alt.yellowTournesol.active;
const text = colors.decisions.text.actionHigh.grey.default;

export function ArchiveBanner() {
  const { isArchived } = useArchivedSession();

  if (!isArchived) return null;

  return (
    <PermanentBanner
      className="flex items-center justify-center"
      style={{ color: text, backgroundColor: bgColor }}
    >
      <span className="font-bold">Session archivée</span>
    </PermanentBanner>
  );
}
