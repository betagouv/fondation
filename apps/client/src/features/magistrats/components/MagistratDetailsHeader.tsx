import { useLayoutEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useNavigate } from 'react-router';

import { TitleNameIcons } from '@/shared/components/title-name-icons';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import { fullNameCapitalized } from '@/utils/user.utils';
import type { DetailedMagistratDto } from '@api/types';

type MagistratDetailsHeaderProps = {
  context: 'sg' | 'membre';
  magistrat: DetailedMagistratDto;
};

export function MagistratDetailsHeader({ context, magistrat }: MagistratDetailsHeaderProps) {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const headerRef = useRef<HTMLDivElement>(null);
  const titleOffset = useSecondBreadcrumbLinkOffset(headerRef);

  const dashboardPath = context === 'sg' ? ROUTE_PATHS.SG.DASHBOARD : ROUTE_PATHS.TRANSPARENCES.DASHBOARD;

  const segments =
    context === 'sg'
      ? [
          {
            label: formatMessage({ defaultMessage: 'Secrétariat général' }),
            to: ROUTE_PATHS.SG.DASHBOARD,
          },
        ]
      : [
          {
            label: formatMessage({ defaultMessage: 'Transparences' }),
            to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
          },
          {
            label: formatMessage({
              defaultMessage: 'Pouvoir de proposition du garde des Sceaux',
            }),
            to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
          },
        ];

  const goBack = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.history.length > 1) {
      event.preventDefault();
      navigate(-1);
    }
  };

  return (
    <div ref={headerRef}>
      <Breadcrumb
        ariaLabel={formatMessage({
          defaultMessage: "Fil d'Ariane de la fiche magistrat",
        })}
        breadcrumb={{
          currentPageLabel: formatMessage({
            defaultMessage: 'Fiche magistrat',
          }),
          segments,
        }}
        className="fr-my-0"
        id="magistrat-details-breadcrumb"
      />
      <div className="fr-mt-6v flex flex-wrap items-start gap-y-2">
        <div className="min-w-fit shrink-0" style={{ width: titleOffset }}>
          <Link
            className="fr-link fr-link--icon-left fr-icon-arrow-left-line"
            onClick={goBack}
            to={dashboardPath}
          >
            <FormattedMessage defaultMessage="Retour" />
          </Link>
        </div>
        <div>
          <p className="fr-text--lg fr-mb-2v font-medium text-(--text-title-blue-france)">
            <FormattedMessage defaultMessage="Fiche magistrat" />
          </p>
          <h1 className="fr-h2 fr-mb-0">
            <TitleNameIcons
              lolfi={{ href: magistrat.externalUrl }}
              name={`${capitalize(magistrat.civilite.toLowerCase())} ${fullNameCapitalized(magistrat)}`}
              small
            />
          </h1>
        </div>
      </div>
    </div>
  );
}

const SECOND_BREADCRUMB_LINK = '.fr-breadcrumb__list > li:nth-child(2) .fr-breadcrumb__link';

function useSecondBreadcrumbLinkOffset(headerRef: React.RefObject<HTMLDivElement | null>) {
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const measure = () => {
      const link = header.querySelector(SECOND_BREADCRUMB_LINK);
      if (!link) return setOffset(0);
      setOffset(Math.max(0, link.getBoundingClientRect().left - header.getBoundingClientRect().left));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    const link = header.querySelector(SECOND_BREADCRUMB_LINK);
    if (link) observer.observe(link);

    return () => observer.disconnect();
  }, [headerRef]);

  return offset;
}
