import Alert from '@codegouvfr/react-dsfr/Alert';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Compass from '@codegouvfr/react-dsfr/picto/Compass';
import React from 'react';
import { useParams, useSearchParams } from 'react-router';

import { ErrorPageLayout } from '@/shared/ui/error-page';
import { useLolfiMagistratUrlQuery } from '@queries/nomination-sessions.queries';

function useCountdown(time = 5_000) {
  const [remainingSeconds, setRemainingSeconds] = React.useState(time / 1_000);
  const [isEnded, setIsEnded] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((s) => {
        const next = s - 1;
        if (next <= 0) {
          setIsEnded(true);
          clearInterval(interval);
        }
        return next;
      });
    }, 1_000);

    return () => clearInterval(interval);
  }, [time, setRemainingSeconds]);

  return { remainingSeconds, isEnded };
}

function LolfiRedirectMagistratInner() {
  const { sessionId, fileId } = useParams();
  const [searchParams] = useSearchParams();
  const { data, error } = useLolfiMagistratUrlQuery({
    sessionId: sessionId!,
    nominationFileId: fileId!,
  });

  const magistratName = React.useMemo(() => searchParams.get('name') ?? null, [searchParams]);
  const closeWindow = React.useCallback(() => {
    window.close();
  }, []);

  const { remainingSeconds, isEnded } = useCountdown(3_000);

  if (isEnded && !error && data?.url) {
    window.location.href = data.url;
  }

  return (
    <ErrorPageLayout pictogram={Compass}>
      <h1>{error ? 'Impossible de vous rediriger' : 'Redirection en cours...'}</h1>
      {error ? (
        <>
          <Alert
            severity="error"
            title="Nous n'avons pas trouvé l'identifiant LOLFI de ce magistrat"
            description="Nous nous excusons pour la gêne occasionnée."
          />
          <ButtonsGroup
            className="fr-mt-2v"
            inlineLayoutWhen="md and up"
            buttons={[{ onClick: closeWindow, children: 'Revenir au contenu', priority: 'primary' }]}
          />
        </>
      ) : (
        <p className={cx('fr-text--lead', 'fr-mb-6v')}>
          {magistratName
            ? `Nous vous redirigerons vers la page LOLFI de ${magistratName} dans ${remainingSeconds} ${remainingSeconds > 1 ? 'secondes' : 'seconde'}`
            : `Nous vous redirigerons vers la page LOLFI du magistrat dans ${remainingSeconds} ${remainingSeconds > 1 ? 'secondes' : 'seconde'}`}
        </p>
      )}
    </ErrorPageLayout>
  );
}

export function LolfiRedirectMagistrat() {
  return <LolfiRedirectMagistratInner />;
}
