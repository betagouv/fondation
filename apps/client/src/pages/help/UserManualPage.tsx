import { AuthGuard } from '@/components/guards/AuthGuard';
import { AUTHORIZED_ROLES } from '@/constants/authorized-roles.constants';
import { useIsSg } from '@/hooks/roles.hook';

export function UserManualPage() {
  const isSg = useIsSg();

  return (
    <AuthGuard authorizedRoles={AUTHORIZED_ROLES.ALL}>
      <section className="fr-container fr-py-10v w-5/12 min-w-4xl">
        {isSg ? <SGUserManual /> : <MemberUserManual />}
      </section>
    </AuthGuard>
  );
}

function UserManualHeading(props: { children: string }) {
  return (
    <header className="fr-mb-8v">
      <h1 className="flex items-center justify-center">
        <span>Manuel utilisateur</span>
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
      <UserManualHeading>Membre</UserManualHeading>

      <iframe
        src="https://pineapple-passive-82f.notion.site/ebd/2a2a2ff25f158025be23dd4e924eb9ec"
        width="100%"
        height="600"
        frameBorder={0}
        allowFullScreen
      />
    </>
  );
}

function SGUserManual() {
  return (
    <>
      <UserManualHeading>Secrétariat Général</UserManualHeading>
      <iframe
        src="https://pineapple-passive-82f.notion.site/ebd/2a2a2ff25f1580a7a9e0f4c88a308d5a"
        width="100%"
        height="600"
        frameBorder={0}
        allowFullScreen
      />
    </>
  );
}
