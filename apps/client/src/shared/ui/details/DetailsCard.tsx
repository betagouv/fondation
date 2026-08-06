import type React from 'react';

export function DetailsCard(props: { children: React.ReactNode }) {
  return (
    <section className="fr-px-6v fr-pt-4v fr-pb-5v bg-(--background-default-grey)">{props.children}</section>
  );
}
