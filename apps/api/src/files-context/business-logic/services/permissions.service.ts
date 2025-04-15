export interface PermissionsService {
  userCanRead({
    userId,
    fileId,
  }: {
    userId: string;
    fileId: string;
  }): Promise<boolean>;
}
