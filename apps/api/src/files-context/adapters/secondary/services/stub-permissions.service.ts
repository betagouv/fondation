import { PermissionsService } from 'src/files-context/business-logic/services/permissions.service';

export class StubPermissionsService implements PermissionsService {
  canReadFile = true;

  async userCanRead() {
    return this.canReadFile;
  }
}
