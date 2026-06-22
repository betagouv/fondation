import DsfrBreadcrumb from '@codegouvfr/react-dsfr/Breadcrumb';
import type { FC } from 'react';
import type { To } from 'react-router';

export type BreadcrumbVM = {
  currentPageLabel: string;
  segments: {
    label: string;
    to: To;
  }[];
};

export type BreadcrumbProps = {
  breadcrumb: BreadcrumbVM;
  id: string;
  ariaLabel: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const Breadcrumb: FC<BreadcrumbProps> = ({
  breadcrumb: { currentPageLabel, segments },
  id,
  ariaLabel,
  ...props
}) => (
  <DsfrBreadcrumb
    {...props}
    id={id}
    aria-label={ariaLabel}
    currentPageLabel={currentPageLabel}
    segments={segments.map(({ label, to }) => ({
      label,
      linkProps: { to },
    }))}
  />
);
