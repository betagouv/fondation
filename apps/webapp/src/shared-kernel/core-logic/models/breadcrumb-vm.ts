export type BreadcrumbVM = {
  currentPageLabel: string;
  segments: {
    label: string;
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  }[];
};
