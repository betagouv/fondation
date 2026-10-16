import { useRef, type MouseEvent, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation, useNavigate, type LinkProps } from 'react-router';

import { useSecondBreadcrumbLinkOffset } from '@/shared/hooks/useSecondBreadcrumbLinkOffset';
import { Collapse } from '@/shared/ui/collapse';

export function DetailsHeader(props: {
  action?: ReactNode;
  backLabel?: ReactNode;
  backTo: LinkProps['to'];
  /** goes back through the history when there is one, so the list this page came from keeps its filters and its scroll */
  backThroughHistory?: boolean;
  breadcrumb?: ReactNode;
  description?: ReactNode;
  overline?: ReactNode;
  title: ReactNode;
}) {
  const headerRef = useRef<HTMLDivElement>(null);
  const titleOffset = useSecondBreadcrumbLinkOffset(headerRef);
  const location = useLocation();
  const navigate = useNavigate();

  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!props.backThroughHistory || location.key === 'default') return;
    event.preventDefault();
    navigate(-1);
  };

  return (
    <div ref={headerRef}>
      {/* the fold measures the box, not a margin: the room under the breadcrumb is a padding */}
      <Collapse>
        <div className="pb-7 [&_.fr-breadcrumb]:mb-0">{props.breadcrumb}</div>
      </Collapse>

      <div className="flex flex-wrap items-start gap-y-2">
        <div className="fr-pr-8v min-w-fit shrink-0" style={{ width: titleOffset || undefined }}>
          <Link
            className="fr-link fr-link--icon-left fr-icon-arrow-left-line"
            onClick={goBack}
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
          <h1 className="fr-h3 fr-mb-0">{props.title}</h1>
          {props.description && (
            <p className="fr-mt-3v fr-mb-0 max-w-3xl leading-7 text-(--text-mention-grey)">
              {props.description}
            </p>
          )}
        </div>

        {props.action && <div className="ml-auto">{props.action}</div>}
      </div>
    </div>
  );
}
