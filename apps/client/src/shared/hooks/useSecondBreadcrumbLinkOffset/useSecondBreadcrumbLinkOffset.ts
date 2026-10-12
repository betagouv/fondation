import { useLayoutEffect, useState, type RefObject } from 'react';

const SECOND_BREADCRUMB_LINK = '.fr-breadcrumb__list > li:nth-child(2) .fr-breadcrumb__link';

export function useSecondBreadcrumbLinkOffset(headerRef: RefObject<HTMLDivElement | null>) {
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
