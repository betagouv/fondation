import { Module } from '@nestjs/common';

import { PdfRenderer } from './pdf-renderer.service';

@Module({
  exports: [PdfRenderer],
  providers: [PdfRenderer],
})
export class PdfModule {}
