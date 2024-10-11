export interface ReportListItemVM {
  id: string;
  name: string;
  dueDate: string | null;
}

export interface ReportListingVM {
  data: ReportListItemVM[];
}
