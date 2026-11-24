import { FormattedMessage, useIntl } from 'react-intl';

import { Modal } from '@/shared/ui/modal';
import { Timeline } from '@/shared/ui/timeline';
import { whoWrote } from '@/utils/user.utils';
import { useUser } from '@queries/auth.queries';
import type { CallForApplications } from '@queries/calls-for-applications.queries';

/** what was done to the call, by whom and when, the latest first */
export function CallForApplicationsHistoryModal(props: {
  history: CallForApplications['history'];
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
}) {
  const { formatList, formatMessage } = useIntl();
  const { user } = useUser();

  return (
    <Modal
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      size="medium"
      title={formatMessage({ defaultMessage: "Historique de l'appel à candidatures" })}
    >
      <div className="fr-mt-6v fr-mb-4v">
        <Timeline
          items={props.history.map(({ action, at, by, fields }) => ({
            at,
            content: (
              <FormattedMessage
                defaultMessage="{who, select, self {Vous avez} someone {{name} a} other {Un compte supprimé a}} {action, select, CREATED {créé l'appel} DELETED {supprimé l'appel} other {modifié {fields}}}"
                values={{
                  action,
                  fields: formatList(fields.map(({ label }) => label)),
                  name: by?.name,
                  who: whoWrote({ currentUserId: user?.id, writer: by }),
                }}
              />
            ),
            key: `${at} ${action}`,
          }))}
        />
      </div>
    </Modal>
  );
}
