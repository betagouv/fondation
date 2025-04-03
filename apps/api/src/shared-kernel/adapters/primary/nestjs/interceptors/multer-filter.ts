import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const multerFileFilter: MulterOptions['fileFilter'] = (_, file, cb) => {
  // Une issue est ouverte afin d'éviter cette conversion :
  // https://github.com/expressjs/multer/issues/1104
  file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  cb(null, true);
};
