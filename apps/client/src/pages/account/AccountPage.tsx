import { defineMessages, FormattedMessage, type MessageDescriptor } from 'react-intl';

import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';
import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { DetailsCard, DetailsHeader, DetailsPageLayout } from '@/shared/ui/details';
import { capitalize } from '@/utils/string.utils';
import { memberFullName } from '@/utils/user.utils';
import { type SessionUser, useUser } from '@queries/auth.queries';

const PASSWORD_CHANGE_REFUSALS = defineMessages({
  IMPERSONATED: { defaultMessage: "Le mot de passe ne se change pas à la place d'un utilisateur." },
} satisfies Record<Exclude<SessionUser['passwordChange'], 'ALLOWED'>, MessageDescriptor>);

export function AccountPage() {
  const { user } = useUser();
  const isSg = useIsSg();

  if (!user) return null;

  return (
    <DetailsPageLayout
      background={isSg ? 'cafeCreme' : 'blueFrance'}
      header={
        <DetailsHeader
          backThroughHistory
          backTo="/"
          overline={<FormattedMessage defaultMessage="Mon compte" />}
          title={memberFullName(user)}
        />
      }
      identity={
        <DetailsCard className="grow">
          <h2 className="fr-h4">
            <FormattedMessage defaultMessage="Mes informations" />
          </h2>
          <p className="fr-mb-6v text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="Pour les modifier, vous pouvez vous adresser à un administrateur." />
          </p>
          <dl className="m-0 grid gap-x-6 gap-y-4 p-0 md:grid-cols-2">
            <div>
              <dt className="font-bold">
                <FormattedMessage defaultMessage="Nom" />
              </dt>
              <dd className="fr-mt-2v fr-px-4v fr-py-2v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey)">
                {user.lastName.toUpperCase()}
              </dd>
            </div>
            <div>
              <dt className="font-bold">
                <FormattedMessage defaultMessage="Prénom" />
              </dt>
              <dd className="fr-mt-2v fr-px-4v fr-py-2v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey)">
                {capitalize(user.firstName)}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-bold">
                <FormattedMessage defaultMessage="Adresse électronique" />
              </dt>
              <dd className="fr-mt-2v fr-px-4v fr-py-2v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey)">
                {user.email}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-bold">
                <FormattedMessage defaultMessage="Rôle" />
              </dt>
              <dd className="fr-mt-2v fr-px-4v fr-py-2v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey)">
                {user.displayedRole.label}
              </dd>
            </div>
            {user.isAdmin && (
              <div className="md:col-span-2">
                <dt className="font-bold">
                  <FormattedMessage defaultMessage="Droit administrateur" />
                </dt>
                <dd className="fr-mt-2v fr-px-4v fr-py-2v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey)">
                  <FormattedMessage defaultMessage="Oui" />
                </dd>
              </div>
            )}
          </dl>
        </DetailsCard>
      }
      wideIdentity
    >
      <DetailsCard className="grow">
        {user.passwordChange === 'ALLOWED' ? (
          <ChangePasswordForm />
        ) : (
          <p className="fr-mb-0">
            <FormattedMessage {...PASSWORD_CHANGE_REFUSALS[user.passwordChange]} />
          </p>
        )}
      </DetailsCard>
    </DetailsPageLayout>
  );
}
