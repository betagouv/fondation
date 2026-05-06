import Button from '@codegouvfr/react-dsfr/Button';

import { useUser } from '@queries/auth.queries';

export const LolfiCsm = () => {
  const { user } = useUser();

  if (!user) return null;

  return (
    <Button
      className="self-center"
      linkProps={{ to: 'http://lolfi.dsj.intranet.justice.gouv.fr/csm/', target: '_blank' }}
    >
      LOLFI - CSM
    </Button>
  );
};
