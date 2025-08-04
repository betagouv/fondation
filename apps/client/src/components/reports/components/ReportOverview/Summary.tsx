import { SideMenu, type SideMenuProps } from '@codegouvfr/react-dsfr/SideMenu';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { scrollToSummarySection } from '../../dom/scroll-to-summary-section';
import { summaryScrollListenersFactory } from '../../dom/summary-scroll-listeners';
import { useObservedSections } from './hooks/useObservedSections';
import { SUMMARY_SECTIONS } from '../../../../constants/summary-sections.constants';
import { reportHtmlIds } from '../../dom/html-ids';

export type SummaryProps = {
  observers: string[] | null;
};

const { setIsScrolling, createListeners, removeListeners } = summaryScrollListenersFactory();

export const Summary: FC<SummaryProps> = ({ observers }) => {
  const summarySections = SUMMARY_SECTIONS.filter(({ anchorId }) => {
    const isObserverSection = anchorId === reportHtmlIds.overview.observersSection;
    const isOtherSection = !isObserverSection;
    const hasObservers = !!observers?.length;

    return isOtherSection || (isObserverSection && hasObservers);
  });

  const [currentSection, setCurrentSection] = useState<string | null>(null);

  const anchorIds = useMemo(() => summarySections.map(({ anchorId }) => anchorId), [summarySections]);

  const onSectionIdIntersecting = useCallback((sectionId: string) => setCurrentSection(sectionId), []);
  useObservedSections(anchorIds, onSectionIdIntersecting);

  const onAnchorClick = useCallback((anchorId: string) => {
    setCurrentSection(anchorId);
    setIsScrolling();
  }, []);

  useEffect(() => {
    scrollToSummarySection();
    createListeners();
    return removeListeners;
  }, []);

  const sideMenuItems: SideMenuProps.Item[] = SUMMARY_SECTIONS.map(({ anchorId, label }) => ({
    linkProps: {
      href: `#${anchorId}`,
      onClick: () => onAnchorClick(anchorId)
    },
    isActive: currentSection === anchorId,
    text: label
  }));

  return (
    <SideMenu
      align="left"
      sticky
      title="SOMMAIRE"
      burgerMenuButtonText="SOMMAIRE"
      className="w-max"
      items={sideMenuItems}
    />
  );
};
