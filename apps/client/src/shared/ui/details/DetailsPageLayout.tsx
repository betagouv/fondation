import clsx from 'clsx';
import type React from 'react';

import { PinnedHeader } from '@/shared/components/pinned-header';

const BACKGROUNDS = {
  blueFrance: 'bg-(--blue-france-925-125)',
  cafeCreme: 'bg-(--brown-cafe-creme-950-100)',
  greenEmeraude: 'bg-(--background-alt-green-emeraude)',
  info: 'bg-(--background-contrast-info)',
  terreBattue: 'bg-(--orange-terre-battue-950-100)',
} as const;

export function DetailsPageLayout(props: {
  alerts?: React.ReactNode;
  background: keyof typeof BACKGROUNDS;
  children: React.ReactNode;
  header?: React.ReactNode;
  identity: React.ReactNode;
  identityPosition?: 'left' | 'right';
  navigation?: React.ReactNode;
  wideIdentity?: boolean;
}) {
  const identityColumn = props.wideIdentity ? 'fr-col-lg-5' : 'fr-col-lg-4';
  const contentColumn = props.wideIdentity ? 'fr-col-lg-7' : 'fr-col-lg-8';
  const identity = <div className={`fr-col-12 ${identityColumn} flex flex-col gap-6`}>{props.identity}</div>;
  const content = <div className={`fr-col-12 ${contentColumn} flex flex-col gap-6`}>{props.children}</div>;

  const body = (
    <>
      {props.alerts}
      {props.navigation}
      <div className={`grow ${BACKGROUNDS[props.background]}`}>
        <div className="fr-container fr-py-10v">
          <div className="fr-grid-row fr-grid-row--gutters">
            {props.identityPosition === 'right' ? (
              <>
                {content}
                {identity}
              </>
            ) : (
              <>
                {identity}
                {content}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (!props.header) return <div className="flex grow flex-col">{body}</div>;

  return (
    <PinnedHeader
      bar={(isPinned) => (
        <div className={clsx('fr-container', isPinned ? 'fr-pt-6v' : 'fr-pt-8v')}>{props.header}</div>
      )}
      className="grow"
      contentClassName="flex grow flex-col"
    >
      {body}
    </PinnedHeader>
  );
}
