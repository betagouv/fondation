/** titleSlot only exists while the header is pinned */
export type VeilleDesPostesOutletContext = {
  filtersSlot: HTMLDivElement | null;
  /** the page keeps only the current tab while a side panel is open */
  onSidePanelToggle: (open: boolean) => void;
  titleSlot: HTMLSpanElement | null;
};
