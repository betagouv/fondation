import { SideMenu, type SideMenuProps } from '@codegouvfr/react-dsfr/SideMenu';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';

import { reportHtmlIds } from '@/features/reports/constants/html-ids.constants';
import { SUMMARY_SECTIONS } from '@/features/reports/constants/summary-sections.constants';
import { useObservedSections } from '@/features/reports/hooks/useObservedSections';
import { scrollToSummarySection } from '@/features/reports/utils/scroll-to-summary-section';
import { summaryScrollListenersFactory } from '@/features/reports/utils/summary-scroll-listeners';

export type SummaryProps = {
  observers: string[] | null;
  fileComment: string | null;
  summary: { content: string } | null;
};

const { setIsScrolling, createListeners, removeListeners } = summaryScrollListenersFactory();

export const Summary: FC<SummaryProps> = ({ observers, summary, fileComment }) => {
  const summarySections = SUMMARY_SECTIONS.filter(({ anchorId }) => {
    const isObserverSection = anchorId === reportHtmlIds.overview.observersSection;
    if (isObserverSection) {
      const hasObservers = !!observers?.length;
      return hasObservers;
    }

    const isSummarySection = anchorId === reportHtmlIds.overview.summary;
    if (isSummarySection) {
      const hasSummary = summary && !!summary.content;
      return hasSummary;
    }

    const isFileCommentSection = anchorId === reportHtmlIds.overview.fileComment;
    if (isFileCommentSection) {
      const hasFileComment = !!fileComment?.trim();
      return hasFileComment;
    }

    return true;
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

  const sideMenuItems: SideMenuProps.Item[] = summarySections.map(({ anchorId, label }) => ({
    linkProps: {
      href: `#${anchorId}`,
      onClick: () => onAnchorClick(anchorId),
    },
    isActive: currentSection === anchorId,
    text: label,
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
