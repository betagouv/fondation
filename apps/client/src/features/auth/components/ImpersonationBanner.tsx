import { colors } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { PermanentBanner } from '@/shared/components/banners';
import { memberFullName } from '@/utils/user.utils';
import { useLogout, useUser } from '@queries/auth.queries';

const text = colors.options.purpleGlycine.main494.default;
const bgColor = colors.options.purpleGlycine._950_100.default;

export function ImpersonationBanner() {
  const { user } = useUser();
  const { mutate, isPending } = useLogout();

  const onClick = React.useCallback(() => {
    mutate(undefined, {
      onSuccess: () => {
        window.close();
      },
    });
  }, [mutate]);

  if (!user?.isImpersonated) return null;

  return (
    <PermanentBanner className="flex items-center" style={{ color: text, backgroundColor: bgColor }}>
      <span>
        <FormattedMessage
          defaultMessage="Connecté en tant que <b>{name}</b>"
          values={{ b: (chunks) => <strong>{chunks}</strong>, name: user ? memberFullName(user) : '' }}
        />
      </span>
      <Button
        size="small"
        className="fr-ml-1v"
        priority="tertiary no outline"
        onClick={onClick}
        disabled={isPending}
      >
        <FormattedMessage defaultMessage="Déconnecter" />
      </Button>
    </PermanentBanner>
  );
}
