import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';
import React from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { useMemberListQuery } from '@queries/members.queries';
import { useNominationFilesTable } from '@/components/shared/nomination-files-table/contexts/files-table.context';
import { DropdownRapporteurs } from './DropdownRapporteurs';

function requires2Reporters(dossier: SessionNominationFile) {
  return (
    dossier.reporters.length > 0 &&
    dossier.reporters.length < 2 &&
    dossier.content.posteCible &&
    [
      'procureur general',
      'premier avocat general pres la cour de cassation',
      'avocat general près la cour de cassation',
      'procureur pres la cour de cassation',
      'procureur national anti-terroriste',
      'procureur national financier'
    ].some((position) =>
      (dossier.content.posteCible as string)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(position)
    )
  );
}

function ReportersAlert(props: {
  dossier: SessionNominationFile;
  children?: (children: React.ReactNode) => React.ReactNode;
}) {
  if (!requires2Reporters(props.dossier)) return null;

  const output = (
    <div className="multi-reporters-alert cursor-pointer">
      <Tooltip title="2 rapporteurs attendus">
        <i
          style={{
            color: colors.decisions.text.default.warning.default,
            backgroundColor: colors.decisions.background.contrast.warning.default
          }}
          className={clsx(
            cx('fr-icon-warning-fill'),
            'text-center',
            'block',
            'rounded-full',
            'p-1',
            'size-6',
            'before:block',
            'before:content-[""]',
            'before:size-4'
          )}
        />
      </Tooltip>
    </div>
  );

  if (props.children) {
    return props.children(output);
  }

  return output;
}

export function ReportersSelector(props: { dossier: SessionNominationFile }) {
  const { formation } = useNominationFilesTable();
  const { data } = useMemberListQuery({
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 }
  });

  const reporters = React.useMemo(
    () => (data?.items ?? []).map(({ id, firstName, lastName }) => ({ userId: id, firstName, lastName })),
    [data]
  );

  return (
    <div>
      <ReportersAlert dossier={props.dossier} />

      <DropdownRapporteurs fileId={props.dossier.id} reporters={reporters} />
    </div>
  );
}

export function ReadOnlyReportersCell(props: { dossier: SessionNominationFile }) {
  if (props.dossier.reporters.length === 0) return '-';

  return (
    <ul className="m-0 list-none p-0">
      <ReportersAlert dossier={props.dossier}>{(children) => <li>{children}</li>}</ReportersAlert>

      {props.dossier.reporters.map(({ id, firstName, lastName }) => (
        <li key={id}>{`${firstName} ${lastName}`.toUpperCase()}</li>
      ))}
    </ul>
  );
}
