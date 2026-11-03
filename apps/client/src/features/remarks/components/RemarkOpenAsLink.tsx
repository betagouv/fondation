import { FormattedMessage, useIntl } from 'react-intl';

import { useTab } from '@/shared/hooks/useTab';
import { useToasts } from '@/shared/ui/toast';
import { tabImpersonation } from '@/utils/tab-impersonation';
import { useImpersonateMutation } from '@queries/auth.queries';

/** reopens the page of a remark as the account it was seen from, the impersonation banner included */
export function RemarkOpenAsLink(props: { account: { id: string; name: string }; url: string }) {
  const { formatMessage } = useIntl();
  const tab = useTab();
  const toasts = useToasts();
  const { isPending, mutate: impersonate } = useImpersonateMutation({ userId: props.account.id });

  return (
    <>
      <span className="ri-user-shared-fill fr-icon--xs mb-1 flex items-center gap-1 text-xs text-(--text-action-high-blue-france)">
        <FormattedMessage defaultMessage="S'ouvre en tant que {name}" values={{ name: props.account.name }} />
      </span>
      <a
        aria-disabled={isPending}
        className="box-decoration-clone"
        href={props.url}
        onClick={(event) => {
          event.preventDefault();
          if (isPending) return;
          impersonate(undefined, {
            onError: () =>
              toasts.error({
                title: formatMessage(
                  { defaultMessage: 'Impossible de se connecter en tant que {name}' },
                  { name: props.account.name },
                ),
              }),
            onSuccess: (impersonation) =>
              tab.open(tabImpersonation.carry(new URL(props.url, window.location.href), impersonation.id)),
          });
        }}
      >
        {props.url}
        <span className="fr-sr-only">
          <FormattedMessage defaultMessage="(nouvel onglet)" />
        </span>
      </a>
    </>
  );
}
