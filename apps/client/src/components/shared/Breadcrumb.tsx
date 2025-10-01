import type { FC } from 'react';

import DsfrBreadcrumb from '@codegouvfr/react-dsfr/Breadcrumb';
import type { BreadcrumbVM } from '../../models/breadcrumb-vm.model';

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
    segments={segments.map(({ label, href, onClick }) => ({
      label,
      linkProps: {
        onClick,
        href
      }
    }))}
  />
);
