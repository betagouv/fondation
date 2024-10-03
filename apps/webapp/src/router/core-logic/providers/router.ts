export interface RouterProvider {
  goToLogin(): void;
  goToNominationCaseList(): void;
  gotToNominationCaseOverview(id: string): void;
  getLoginHref(): string;
  getNominationCaseOverviewAnchorAttributes: (id: string) => {
    href: string;
    onClick: () => void;
  };
}
