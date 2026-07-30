import type React from 'react';

const BACKGROUNDS = {
  greenEmeraude: 'bg-(--background-contrast-green-emeraude)',
  info: 'bg-(--background-contrast-info)',
  terreBattue: 'bg-(--orange-terre-battue-950-100)',
} as const;

export function DetailsPageLayout(props: {
  background: keyof typeof BACKGROUNDS;
  children: React.ReactNode;
  header?: React.ReactNode;
  identity: React.ReactNode;
}) {
  return (
    <div className="flex grow flex-col">
      {props.header && (
        <div className="fr-container fondation-details-container fr-py-6v">{props.header}</div>
      )}
      <div className={`grow ${BACKGROUNDS[props.background]}`}>
        <div className="fr-container fondation-details-container fr-py-10v">
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12 fr-col-lg-4">{props.identity}</div>
            <div className="fr-col-12 fr-col-lg-8 flex flex-col gap-6">{props.children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
