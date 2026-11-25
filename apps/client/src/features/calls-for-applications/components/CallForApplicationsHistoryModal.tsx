import { Fragment } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Modal } from '@/shared/ui/modal';
import { Timeline } from '@/shared/ui/timeline';
import { Tooltip } from '@/shared/ui/tooltip';
import { whoWrote } from '@/utils/user.utils';
import { useUser } from '@queries/auth.queries';
import type { CallForApplications } from '@queries/calls-for-applications.queries';

type Change = CallForApplications['history'][number]['changes'][number];
type Target = { label: string };

/** the names of the courts or the positions: both lists are told apart only when the update did both */
function TargetsDetail(props: { targets: { added: readonly Target[]; removed: readonly Target[] } }) {
  const { formatList } = useIntl();
  const { added, removed } = props.targets;
  const labelsOf = (targets: readonly Target[]) => formatList(targets.map(({ label }) => label));
  if (removed.length === 0) return labelsOf(added);
  if (added.length === 0) return labelsOf(removed);

  return (
    <>
      <FormattedMessage
        defaultMessage="{count, plural, one {Ajout} other {Ajouts}} : {targets}"
        values={{ count: added.length, targets: labelsOf(added) }}
      />
      <br />
      <FormattedMessage
        defaultMessage="{count, plural, one {Retrait} other {Retraits}} : {targets}"
        values={{ count: removed.length, targets: labelsOf(removed) }}
      />
    </>
  );
}

function ChangeLabel(props: { change: Change }) {
  const { formatMessage } = useIntl();
  const { label, targets } = props.change;
  if (!targets) return label;

  return (
    <>
      {label}{' '}
      <Tooltip className="align-middle" focusable label={<TargetsDetail targets={targets} />}>
        <span
          aria-label={formatMessage({ defaultMessage: 'Détail : {label}' }, { label })}
          className="fr-icon-information-line fr-icon--sm text-(--text-action-high-blue-france)"
          role="img"
        />
      </Tooltip>
    </>
  );
}

/** the fields grouped by what the update did to them: "ajouté un commentaire et modifié la date limite" */
function ChangesSentence(props: { changes: readonly Change[] }) {
  const { formatList } = useIntl();
  const groups = Map.groupBy(props.changes, ({ change }) => change.label);

  return formatList(
    [...groups].map(([verb, changes]) => (
      <Fragment key={verb}>
        {verb} {formatList(changes.map((change) => <ChangeLabel change={change} key={change.label} />))}
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
