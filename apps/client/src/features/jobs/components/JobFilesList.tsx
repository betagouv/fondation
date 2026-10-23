import clsx from 'clsx';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useSelectedJob } from '../context/job.context';
import type { JobFile, Tree } from '../types/job.types';
import { bySeverity } from '../utils/by-severity.utils';
import { formatJobDuration } from '../utils/format-job-duration.utils';
import { JOB_STATUS_ICONS } from '../utils/job-status.utils';
import { tree } from '../utils/tree.utils';
import { SeverityEnumCountMessages, type SeverityEnum } from '@/shared/enums/severity.enum';

const ENTITY_NAMES: Record<string, string> = {
  'CANDIDATS.xml': 'Candidat',
  'DESIDERATA.xml': 'Desiderata',
  'FONCTIONS.xml': 'Fonction',
  'GRADES.xml': 'Grade',
  'JURIDICTIONS.xml': 'Juridiction',
  'MAGISTRATS.xml': 'Magistrat',
  'POSADS.xml': 'Position administrative',
  'POSTE_2.xml': 'Poste',
  'SESSION.xml': 'Session',
  'TRANSPARENCES.xml': 'Transparence',
  'TYPE_JURIDICTION.xml': 'Type de juridiction',
};

const SEVERITY_TEXT_COLORS = {
  ERROR: 'text-(--text-default-error)',
  WARNING: 'text-(--text-default-warning)',
} as const satisfies Record<SeverityEnum, string>;

type Row = { depth: number; node: Omit<Tree, 'children'> };

function inIngestionOrder(trees: readonly Tree[], depth = 0): Row[] {
  return trees.flatMap(({ children, ...node }) => [
    { depth, node },
    ...inIngestionOrder(children, depth + 1),
  ]);
}

function statusIcon(node: Row['node']) {
  if (node.status !== 'FAILED' && node.messages.length > 0) return JOB_STATUS_ICONS.WARNING;
  return JOB_STATUS_ICONS[node.status];
}

function JobFileMessages(props: { file: Row['node'] }) {
  const { formatMessage } = useIntl();
  const entityName = ENTITY_NAMES[props.file.name];
  const groups = bySeverity(props.file.messages);

  if (groups.length === 0) {
    return (
      <p className="fr-mb-0 text-sm text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Aucune erreur ni avertissement" />
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map(({ messages, severity }) => (
        <div key={severity}>
          <p className={clsx('fr-mb-1v text-sm font-bold', SEVERITY_TEXT_COLORS[severity])}>
            {formatMessage(SeverityEnumCountMessages[severity], { count: messages.length })}
          </p>
          <ul className="fr-m-0 fr-p-0 flex list-none flex-col gap-1 text-sm">
            {messages.map((message, index) => (
              <li className="wrap-break-word" key={index}>
                {message.entityNumber != null && (
                  <span className="font-bold">
                    {entityName} n°{' '}
                    {message.entityNumber} :{' '}
                  </span>
                )}
                {message.entityId != null && (
                  <span className="font-bold">
                    {entityName} #{message.entityId} :{' '}
                  </span>
                )}
                {message.text}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function JobFilesList(props: { files: readonly JobFile[] }) {
  const { formatMessage } = useIntl();
  const rows = useMemo(() => inIngestionOrder(tree(props.files)), [props.files]);
  const { selectedFileId, toggleFile } = useSelectedJob();

  return (
    <ul className="fr-m-0 fr-p-0 flex list-none flex-col divide-y divide-(--border-default-grey) rounded-sm border border-solid border-(--border-default-grey)">
      {rows.map(({ depth, node }) => {
        const { icon, textColor } = statusIcon(node);
        const duration = formatJobDuration(node);
        const isSelected = selectedFileId === node.id;

        return (
          <li className="fr-p-0" key={node.id}>
            <button
              aria-expanded={isSelected}
              className={clsx(
                'flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-(--background-default-grey-hover)',
                isSelected && 'bg-(--background-alt-blue-france)',
              )}
              onClick={() => toggleFile(node.id)}
              style={{ paddingLeft: `${1 + depth}rem` }}
              type="button"
            >
              <span
                aria-hidden
                className={clsx(
                  icon,
                  textColor,
                  'shrink-0 before:size-4! before:align-middle before:content-[""]',
                )}
              />
              <span className="font-medium">{node.name}</span>
              {bySeverity(node.messages).map(({ messages, severity }) => (
                <span className={clsx('text-xs', SEVERITY_TEXT_COLORS[severity])} key={severity}>
                  {formatMessage(SeverityEnumCountMessages[severity], { count: messages.length })}
                </span>
              ))}
              {duration && (
                <span className="ml-auto text-xs text-(--text-mention-grey) tabular-nums">{duration}</span>
              )}
            </button>
            {isSelected && (
              <div className="border-t border-(--border-default-grey) bg-(--background-alt-grey) px-4 py-3">
                <JobFileMessages file={node} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
