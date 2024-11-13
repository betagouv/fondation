export interface RouterProvider {
  goToLogin(): void;
  goToReportList(): void;
  gotToReportOverview(id: string): void;
  getLoginHref(): string;
  getReportListHref(): string;
  getReportOverviewAnchorAttributes: (id: string) => {
    href: string;
    onClick: () => void;
  };
}
