export interface RouterProvider {
  goToLogin(): void;
  goToNominationFileList(): void;
  gotToNominationFileOverview(id: string): void;
  getLoginHref(): string;
  getNominationFileListHref(): string;
  getNominationFileOverviewAnchorAttributes: (id: string) => {
    href: string;
    onClick: () => void;
  };
}
