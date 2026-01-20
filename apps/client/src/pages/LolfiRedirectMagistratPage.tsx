import Alert from '@codegouvfr/react-dsfr/Alert';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Compass from '@codegouvfr/react-dsfr/picto/Compass';
import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';

import { AuthGuard } from '@/components/guards/AuthGuard';
import { OvoidBackground, OvoidMotif } from '@/components/shared/ovoid';
import { AUTHORIZED_ROLES } from '@/constants/authorized-roles.constants';
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
  const { data, error } = useLolfiMagistratUrlQuery({ sessionId: sessionId!, nominationFileId: fileId! });

  const magistratName = React.useMemo(() => searchParams.get('name') ?? null, [searchParams]);
  const closeWindow = React.useCallback(() => {
    window.close();
  }, []);

  const { remainingSeconds, isEnded } = useCountdown();

  if (isEnded && data?.url) return <Navigate to={data.url} />;

  return (
    <div className="fr-container">
      <div
        className={cx(
          'fr-my-7w',
          'fr-mt-md-12w',
          'fr-mb-md-10w',
          'fr-grid-row',
          'fr-grid-row--gutters',
          'fr-grid-row--middle',
          'fr-grid-row--center'
        )}
      >
        <div className={cx('fr-py-0', 'fr-col-12', 'fr-col-md-6')}>
          <h1>{error ? 'Impossible de vous rediriger' : 'Redirection en cours...'}</h1>
          {error ? (
            <>
              <Alert
                severity="error"
                title="Nous n'avons pas trouvé l'identifiant LOLFI de ce magistrat"
                description="Nous nous excusons pour la gêne occasionnée."
              />
              <ButtonsGroup
                className="mt-2"
                inlineLayoutWhen="md and up"
                buttons={[{ onClick: closeWindow, children: 'Revenir au contenu', priority: 'primary' }]}
              />
            </>
          ) : (
            <p className={cx('fr-text--lead', 'fr-mb-3w')}>
              {magistratName
                ? `Nous vous redirigerons vers la page LOLFI de ${magistratName} dans ${remainingSeconds} ${remainingSeconds > 1 ? 'secondes' : 'seconde'}`
                : `Nous vous redirigerons vers la page LOLFI du magistrat dans ${remainingSeconds} ${remainingSeconds > 1 ? 'secondes' : 'seconde'}`}
            </p>
          )}
        </div>

        <div
          className={cx(
            'fr-col-12',
            'fr-col-md-3',
            'fr-col-offset-md-1',
            'fr-px-6w',
            'fr-px-md-0',
            'fr-py-0'
          )}
        >
          <div className="relative h-[200px] w-40">
            <OvoidMotif className="absolute" />
            <OvoidBackground className="fr-artwork-background absolute" />

            <Compass aria-hidden width="80" height="100" className="fr-artwork fr-responsive-img absolute" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LolfiRedirectMagistrat() {
  return (
    <AuthGuard authorizedRoles={AUTHORIZED_ROLES.ALL}>
      <LolfiRedirectMagistratInner />
    </AuthGuard>
  );
}
