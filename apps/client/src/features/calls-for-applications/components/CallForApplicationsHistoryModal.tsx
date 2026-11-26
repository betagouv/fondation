import { Fragment } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Modal } from '@/shared/ui/modal';
import { Timeline } from '@/shared/ui/timeline';
import { Tooltip } from '@/shared/ui/tooltip';
import { whoWrote } from '@/utils/user.utils';
import { useUser } from '@queries/auth.queries';
import type { CallForApplications } from '@queries/calls-for-applications.queries';

type Change = CallForApplications['history'][number]['changes'][number];

function ChangeLabel(props: { change: Change }) {
  const { formatList, formatMessage } = useIntl();
  const { label, targets } = props.change;
  if (!targets) return label;

  return (
    <>
      {label}{' '}
      <Tooltip className="align-middle" focusable label={formatList(targets.map((target) => target.label))}>
        <span
          aria-label={formatMessage({ defaultMessage: 'Détail : {label}' }, { label })}
          className="fr-icon-information-line fr-icon--sm text-(--text-action-high-blue-france)"
          role="img"
        />
      </Tooltip>
    </>
  );
}

/** the changes in the order the API serves them: the API has already grouped the fields under their verb */
function ChangesSentence(props: { changes: readonly Change[] }) {
  const { formatList } = useIntl();

  return formatList(
    props.changes.map((change) => (
      <Fragment key={`${change.change.id} ${change.label}`}>
        {change.change.label} <ChangeLabel change={change} />
      </Fragment>
    )),
  );
}

/** what was done to the call, by whom and when, the latest first */
export function CallForApplicationsHistoryModal(props: {
  history: CallForApplications['history'];
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
}) {
  const { formatMessage } = useIntl();
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
          items={props.history.map(({ action, at, by, changes }) => ({
            at,
            content: (
              <FormattedMessage
                defaultMessage="{who, select, self {Vous avez} someone {{name} a} other {Un compte supprimé a}} {action, select, CREATED {créé l'appel} DELETED {supprimé l'appel} other {{changes}}}"
                values={{
                  action,
                  changes: <ChangesSentence changes={changes} />,
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
