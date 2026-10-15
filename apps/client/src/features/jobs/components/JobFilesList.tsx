import clsx from 'clsx';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { useSelectedJob } from '../context/job.context';
import type { JobFile, Tree } from '../types/job.types';
import { formatJobDuration } from '../utils/format-job-duration.utils';
import { JOB_STATUS_ICONS } from '../utils/job-status.utils';
import { tree } from '../utils/tree.utils';

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

type Row = { depth: number; node: Omit<Tree, 'children'> };

function inIngestionOrder(trees: readonly Tree[], depth = 0): Row[] {
  return trees.flatMap(({ children, ...node }) => [
    { depth, node },
    ...inIngestionOrder(children, depth + 1),
  ]);
}

function statusIcon(node: Row['node']) {
  if (node.status !== 'FAILED' && node.errors.length > 0) return JOB_STATUS_ICONS.WARNING;
  return JOB_STATUS_ICONS[node.status];
}

function JobFileErrors(props: { file: Row['node'] }) {
  const entityName = ENTITY_NAMES[props.file.name];

  if (props.file.errors.length === 0) {
    return (
      <p className="fr-mb-0 text-sm text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Aucune erreur" />
      </p>
    );
  }

  return (
    <ul className="fr-m-0 fr-p-0 flex list-none flex-col gap-1 text-sm">
      {props.file.errors.map((error, index) => (
        <li className="wrap-break-word" key={index}>
          {error.entityNumber != null && (
            <span className="font-bold">
              {entityName} n°{' '}
              {error.entityNumber} :{' '}
            </span>
          )}
          {error.entityId != null && (
            <span className="font-bold">
              {entityName} #{error.entityId} :{' '}
            </span>
          )}
          {error.error}
        </li>
      ))}
    </ul>
  );
}

export function JobFilesList(props: { files: readonly JobFile[] }) {
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
              {node.errors.length > 0 && (
                <span className="text-xs text-(--text-default-warning)">
                  <FormattedMessage
                    defaultMessage="{count, plural, one {# erreur} other {# erreurs}}"
                    values={{ count: node.errors.length }}
                  />
                </span>
              )}
              {duration && (
                <span className="ml-auto text-xs text-(--text-mention-grey) tabular-nums">{duration}</span>
              )}
            </button>
            {isSelected && (
              <div className="border-t border-(--border-default-grey) bg-(--background-alt-grey) px-4 py-3">
                <JobFileErrors file={node} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
