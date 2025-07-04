import { FC } from "react";
import { BreadcrumbVM } from "../../../core-logic/models/breadcrumb-vm";

import DsfrBreadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";

export interface BreadcrumbProps {
  breadcrumb: BreadcrumbVM;
  id: string;
  ariaLabel: string;
}

export const Breadcrumb: FC<BreadcrumbProps> = ({
  breadcrumb: { currentPageLabel, segments },
  id,
  ariaLabel,
}) => (
  <DsfrBreadcrumb
    id={id}
    aria-label={ariaLabel}
    currentPageLabel={currentPageLabel}
    segments={segments.map(({ label, href, onClick }) => ({
      label,
      linkProps: {
        onClick,
        href,
      },
    }))}
  />
);
