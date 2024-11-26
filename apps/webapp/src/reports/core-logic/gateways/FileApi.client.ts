export interface FileApiClient {
  generateUrl(reportId: string, fileName: string): Promise<string>;
}
