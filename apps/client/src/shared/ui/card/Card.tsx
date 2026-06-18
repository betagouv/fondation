import { Card as DsfrCard } from '@codegouvfr/react-dsfr/Card';
import type { RegisteredLinkProps } from '@codegouvfr/react-dsfr/link';
import clsx from 'clsx';

export type CardProps = {
  title: string;
  description: string;
  linkProps: RegisteredLinkProps;
} & React.HTMLAttributes<HTMLDivElement>;

export function Card({ title, description, className, linkProps }: CardProps) {
  return (
    <DsfrCard
      className={clsx('container', className)}
      title={title}
      desc={description}
      enlargeLink
      linkProps={linkProps}
    />
  );
}
