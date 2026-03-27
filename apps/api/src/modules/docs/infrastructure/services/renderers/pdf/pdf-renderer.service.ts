import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import path from 'path';
import Piscina from 'piscina';

@Injectable()
export class PdfRenderer implements OnModuleInit, OnModuleDestroy {
  private pool!: Piscina;

  onModuleInit(): void {
    const ext = __filename.endsWith('.ts') ? '.ts' : '.js';
    this.pool = new Piscina({
      filename: path.resolve(__dirname, `pdf-worker${ext}`),
      execArgv: process.execArgv,
      minThreads: 1,
      maxThreads: 2,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.destroy();
  }

  async render(html: string): Promise<Buffer> {
    const result: Uint8Array = await this.pool.run(html);
    return Buffer.from(result);
  }
}
