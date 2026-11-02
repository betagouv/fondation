import { FormattedMessage, useIntl } from 'react-intl';

import { useTab } from '@/shared/hooks/useTab';
import { useToasts } from '@/shared/ui/toast';
import { useImpersonateMutation } from '@queries/auth.queries';

/** reopens the page of a remark sent while impersonating as the account viewed then, the impersonation banner included */
export function RemarkImpersonatedLink(props: { impersonated: { id: string; name: string }; url: string }) {
  const { formatMessage } = useIntl();
  const tab = useTab();
  const toasts = useToasts();
  const { isPending, mutate: impersonate } = useImpersonateMutation({ userId: props.impersonated.id });

  return (
    <>
      <span className="ri-user-shared-fill fr-icon--xs mb-1 flex items-center gap-1 text-xs text-(--text-action-high-blue-france)">
        <FormattedMessage
          defaultMessage="S'ouvre en tant que {name}"
          values={{ name: props.impersonated.name }}
        />
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
                  { name: props.impersonated.name },
                ),
              }),
            onSuccess: () => tab.open(new URL(props.url, window.location.href)),
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
