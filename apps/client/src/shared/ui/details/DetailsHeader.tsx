import type React from 'react';
import { useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, type LinkProps } from 'react-router';

import { useSecondBreadcrumbLinkOffset } from '@/shared/hooks/useSecondBreadcrumbLinkOffset';

export function DetailsHeader(props: {
  action?: React.ReactNode;
  backLabel?: React.ReactNode;
  backTo: LinkProps['to'];
  breadcrumb?: React.ReactNode;
  onBackClick?: React.MouseEventHandler<HTMLAnchorElement>;
  overline?: React.ReactNode;
  title: React.ReactNode;
}) {
  const headerRef = useRef<HTMLDivElement>(null);
  const titleOffset = useSecondBreadcrumbLinkOffset(headerRef);

  return (
    <div ref={headerRef}>
      {props.breadcrumb}

      <div className="fr-mt-6v flex flex-wrap items-start gap-y-2">
        <div className="fr-pr-8v min-w-fit shrink-0" style={{ width: titleOffset || undefined }}>
          <Link
            className="fr-link fr-link--icon-left fr-icon-arrow-left-line"
            onClick={props.onBackClick}
            to={props.backTo}
          >
            {props.backLabel ?? <FormattedMessage defaultMessage="Retour" />}
          </Link>
        </div>

        <div>
          {props.overline && (
            <p className="fr-text--lg fr-mb-2v font-medium text-(--text-title-blue-france)">
              {props.overline}
            </p>
          )}
          <h1 className="fr-h2 fr-mb-0">{props.title}</h1>
        </div>

        {props.action && <div className="ml-auto">{props.action}</div>}
      </div>
    </div>
  );
}
