import { colors } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import { useEffect, useReducer, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { PermanentBanner } from '@/shared/components/banners';
import { tabImpersonation } from '@/utils/tab-impersonation';
import { memberFullName } from '@/utils/user.utils';
import { useLogout, useUser } from '@queries/auth.queries';

const text = colors.options.purpleGlycine.main494.default;
const bgColor = colors.options.purpleGlycine._950_100.default;

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

export function ImpersonationBanner() {
  const { user } = useUser();
  const { isPending, mutate } = useLogout();
  // the tab's storage is no React state: dismissing the banner must render again
  const [, render] = useReducer((count: number) => count + 1, 0);
  const impersonatedName = user?.isImpersonated ? memberFullName(user) : null;
  const endedFor = tabImpersonation.endedFor;

  useEffect(() => {
    if (impersonatedName) tabImpersonation.remember(impersonatedName);
  }, [impersonatedName]);

  if (!impersonatedName && !endedFor) return null;

  const banner = impersonatedName
    ? {
        action: () => mutate(undefined, { onSuccess: () => window.close() }),
        label: <FormattedMessage defaultMessage="Déconnecter" />,
        message: (
          <FormattedMessage
            defaultMessage="Connecté en tant que <b>{name}</b>"
            values={{ b: strong, name: impersonatedName }}
          />
        ),
      }
    : {
        action: () => {
          tabImpersonation.forget();
          render();
        },
        label: <FormattedMessage defaultMessage="Fermer" />,
        message: (
          <FormattedMessage
            defaultMessage="Votre connexion en tant que <b>{name}</b> a pris fin. Cet onglet utilise désormais votre compte."
            values={{ b: strong, name: endedFor }}
          />
        ),
      };

  return (
    <PermanentBanner className="flex items-center" style={{ backgroundColor: bgColor, color: text }}>
      <span role="status">{banner.message}</span>
      <Button
        className="fr-ml-1v"
        disabled={isPending}
        onClick={banner.action}
        priority="tertiary no outline"
        size="small"
      >
        {banner.label}
      </Button>
    </PermanentBanner>
  );
}
