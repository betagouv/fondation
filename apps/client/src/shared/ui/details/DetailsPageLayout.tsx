import type React from 'react';

const BACKGROUNDS = {
  cafeCreme: 'bg-(--brown-cafe-creme-950-100)',
  greenEmeraude: 'bg-(--background-contrast-green-emeraude)',
  info: 'bg-(--background-contrast-info)',
  terreBattue: 'bg-(--orange-terre-battue-950-100)',
} as const;

export function DetailsPageLayout(props: {
  background: keyof typeof BACKGROUNDS;
  children: React.ReactNode;
  header?: React.ReactNode;
  identity: React.ReactNode;
  navigation?: React.ReactNode;
  wideIdentity?: boolean;
}) {
  const identityColumn = props.wideIdentity ? 'fr-col-lg-5' : 'fr-col-lg-4';
  const contentColumn = props.wideIdentity ? 'fr-col-lg-7' : 'fr-col-lg-8';

  return (
    <div className="flex grow flex-col">
      {props.header && <div className="fr-container fr-py-6v">{props.header}</div>}
      {props.navigation}
      <div className={`grow ${BACKGROUNDS[props.background]}`}>
        <div className="fr-container fr-py-10v">
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className={`fr-col-12 ${identityColumn} flex flex-col gap-6`}>{props.identity}</div>
            <div className={`fr-col-12 ${contentColumn} flex flex-col gap-6`}>{props.children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
