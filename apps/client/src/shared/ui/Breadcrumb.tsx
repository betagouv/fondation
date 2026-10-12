import DsfrBreadcrumb from '@codegouvfr/react-dsfr/Breadcrumb';
import type { To } from 'react-router';

export type BreadcrumbVM = {
  currentPageLabel: string;
  segments: {
    label: string;
    to: To;
  }[];
};

type BreadcrumbProps = {
  breadcrumb: BreadcrumbVM;
  id: string;
  ariaLabel: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function Breadcrumb({
  breadcrumb: { currentPageLabel, segments },
  id,
  ariaLabel,
  ...props
}: BreadcrumbProps) {
  return (
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
}
