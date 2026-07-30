import type React from 'react';

const BACKGROUNDS = {
  default: 'bg-(--background-default-grey)',
  terreBattue: 'bg-(--orange-terre-battue-975-75)',
} as const;

export function DetailsCard(props: { background?: keyof typeof BACKGROUNDS; children: React.ReactNode }) {
  return (
    <section className={`fr-px-6v fr-pt-4v fr-pb-5v ${BACKGROUNDS[props.background ?? 'default']}`}>
      {props.children}
    </section>
  );
}
