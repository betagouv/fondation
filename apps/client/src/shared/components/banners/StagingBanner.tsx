import { colors } from '@codegouvfr/react-dsfr';

import { PermanentBanner } from './PermanentBanner';

const textColor = colors.decisions.text.default.warning.default;
const bgColor = colors.decisions.background.contrast.warning.default;

export function StagingBanner() {
  const isStaging = !import.meta.env.DEV && import.meta.env.VITE_DEPLOY_ENV === 'staging';

  if (!isStaging) return null;

  return (
    <PermanentBanner style={{ color: textColor, backgroundColor: bgColor }}>
      <span className="font-bold">Environnement hors-production.</span>
      <span className="fr-ml-1v">Les données affichées sont fictives</span>
    </PermanentBanner>
  );
}
