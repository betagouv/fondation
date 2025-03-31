import { SideMenu, SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { scrollToSummarySection } from "../../dom/scroll-to-summary-section";
import { summaryScrollListenersFactory } from "../../dom/summary-scroll-listeners";
import { useAppSelector } from "../../hooks/react-redux";
import { selectSummary } from "../../selectors/selectSummary";
import { useObservedSections } from "./hooks/useObservedSections";

export type SummaryProps = {
  reportId: string;
};

const { setIsScrolling, createListeners, removeListeners } =
  summaryScrollListenersFactory();

export const Summary: FC<SummaryProps> = ({ reportId }) => {
  const summary = useAppSelector((state) => selectSummary(state, reportId));
  const [currentSection, setCurrentSection] = useState<string | null>(null);

  const anchorIds = useMemo(
    () => summary.map(({ anchorId }) => anchorId),
    [summary],
  );
  const onSectionIdIntersecting = useCallback(
    (sectionId: string) => setCurrentSection(sectionId),
    [],
  );
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

  const sideMenuItems: SideMenuProps.Item[] = summary.map(
    ({ anchorId, label }) => ({
      linkProps: {
        href: `#${anchorId}`,
        onClick: () => onAnchorClick(anchorId),
      },
      isActive: currentSection === anchorId,
      text: label,
    }),
  );

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
