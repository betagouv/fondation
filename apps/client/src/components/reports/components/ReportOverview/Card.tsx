import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { forwardRef, type PropsWithChildren } from 'react';

export type CardProps = {
  id?: string;
  label?: string;
} & PropsWithChildren;

export const Card = forwardRef<HTMLElement, CardProps>(({ id, label, children }, ref) => {
  return (
    <section
      ref={ref}
      id={id}
      aria-label={label}
      className={clsx('rounded-lg bg-white', cx('fr-px-6v', 'fr-py-4v'))}
    >
      {children}
    </section>
  );
});
