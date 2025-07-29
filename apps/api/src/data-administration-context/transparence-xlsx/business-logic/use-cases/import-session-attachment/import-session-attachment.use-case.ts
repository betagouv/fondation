import { ImportSessionAttachmentDto } from 'shared-models';

import { UploadFileService } from 'src/shared-kernel/business-logic/services/upload-file.service';

export class ImportSessionAttachmentUseCase {
  constructor(private readonly uploadFileService: UploadFileService) {}

  // Ajouter le type de formation et remonter au weekly pour avoir plus d'infos.
  // Centraliser l'envoi de fichier via un service ( sauvegarde du fichier en base + upload sur s3)
  // Créer une classe de FileToUpload par SessionType. cf: TransparenceAttachmentFile
  // Mettre à jour la table de transparences avec l'id du fichier (jsonb)
  // Mettre à jour la table des droits en fonction du/des types de formation

  async execute(dto: ImportSessionAttachmentDto, file: Express.Multer.File) {
    await this.uploadFileService.uploadFile(dto.sessionType, 'file-id', file);
  }
}
