import { ImportSessionAttachmentDto } from 'shared-models';
import { TransparenceFile } from 'src/data-administration-context/transparences/business-logic/models/transparence-file';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';

import { UploadFileService } from 'src/shared-kernel/business-logic/services/upload-file.service';

export class ImportSessionAttachmentUseCase {
  constructor(
    private readonly uploadFileService: UploadFileService,
    private readonly apiConfig: ApiConfig,
  ) {}

  // Ajouter le type de formation et remonter au weekly pour avoir plus d'infos.
  // virer l'identifiant généré à la main du FileDocument pour laisser la BDD s'en charger
  // Mettre à jour la table de transparences avec l'id du fichier (jsonb)
  // Mettre à jour la table des droits en fonction du/des types de formation

  async execute(dto: ImportSessionAttachmentDto, file: Express.Multer.File) {
    const transparenceFile = TransparenceFile.from(
      dto.dateSession,
      dto.formation,
      dto.name,
      file,
      this.apiConfig.s3.nominationsContext.transparencesBucketName,
    );
    await this.uploadFileService.uploadFile(transparenceFile);
  }
}
