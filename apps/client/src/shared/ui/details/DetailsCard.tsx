import clsx from 'clsx';
import type React from 'react';

export function DetailsCard(props: { children: React.ReactNode; className?: string }) {
  return (
    <section className={clsx('fr-px-6v fr-pt-4v fr-pb-5v bg-(--background-default-grey)', props.className)}>
      {props.children}
    </section>
  );
}
