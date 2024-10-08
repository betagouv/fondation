export interface ReportListItemVM {
  id: string;
  title: string;
  dueDate: string | null;
}

export interface ReportListingVM {
  data: ReportListItemVM[];
}
