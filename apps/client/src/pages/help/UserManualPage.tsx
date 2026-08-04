import { FormattedMessage } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';

export function UserManualPage() {
  const isSg = useIsSg();

  return (
    <section className="fr-container fr-py-10v w-5/12 min-w-4xl">
      {isSg ? <SGUserManual /> : <MemberUserManual />}
    </section>
  );
}

function UserManualHeading(props: { children: React.ReactNode }) {
  return (
    <header className="fr-mb-8v">
      <h1 className="flex items-center justify-center">
        <span>
          <FormattedMessage defaultMessage="Manuel utilisateur" />
        </span>
        <span className="fr-h3 fr-my-0 fr-ml-2v fr-pl-2v border-y-0 border-r-0 border-l-2 border-solid">
          {props.children}
        </span>
      </h1>
    </header>
  );
}

function MemberUserManual() {
  return (
    <>
      <UserManualHeading>
        <FormattedMessage defaultMessage="Membre" />
      </UserManualHeading>

      <iframe
        allowFullScreen
        className="border-0"
        height="600"
        src="https://pineapple-passive-82f.notion.site/ebd/2a2a2ff25f158025be23dd4e924eb9ec"
        width="100%"
      />
    </>
  );
}

function SGUserManual() {
  return (
    <>
      <UserManualHeading>
        <FormattedMessage defaultMessage="Secrétariat Général" />
      </UserManualHeading>
      <iframe
        allowFullScreen
        className="border-0"
        height="600"
        src="https://pineapple-passive-82f.notion.site/ebd/2a2a2ff25f1580a7a9e0f4c88a308d5a"
        width="100%"
      />
    </>
  );
}
