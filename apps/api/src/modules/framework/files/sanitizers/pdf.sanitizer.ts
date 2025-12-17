import { OnApplicationBootstrap } from '@nestjs/common';
import { exec, spawn } from 'node:child_process';
import {
  PassThrough,
  Transform,
  type Duplex,
  type Readable,
  type TransformCallback,
  type Writable,
} from 'node:stream';
import { FILE_MIME_TYPES, type FileMimeType } from '../mime-type';
import { type FileSanitizer } from './sanitizer';

/**
 * This class calls ghostscript, to print the pdf, and by doing so to "flatten" it,
 * effectively stripping it from any script. This might take some time
 */
export class PdfSanitizer implements OnApplicationBootstrap, FileSanitizer {
  private available = false;

  handles(mimeType: FileMimeType): boolean {
    return this.available && mimeType === FILE_MIME_TYPES.pdf;
  }

  sanitize(): Duplex {
    if (!this.available) {
      return new PassThrough();
    }

    return new GhostscriptPdfTransform();
  }

  async onApplicationBootstrap() {
    exec(`gs --version`, (error) => {
      if (error) {
        this.available = false;
      } else {
        this.available = true;
      }
    });
  }
}

/** @see https://www.jameskerr.blog/posts/pipe-nodejs-readable-stream-into-child-process/ */
class GhostscriptPdfTransform extends Transform {
  #stdin: Writable;
  #stdout: Readable;

  _construct(callback: TransformCallback): void {
    const gs = spawn(
      'gs',
      [
        '-dSAFER',
        '-dNOOUTERSAVE',
        '-dBATCH',
        '-dNOPAUSE',
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.7',
        '-q',
        '-sOutputFile=-',
        '-',
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );

    gs.stdin.on('error', (err) => {
      if ('code' in err && err.code === 'EPIPE') {
        this.emit('end');
      } else {
        this.destroy(err);
      }
    });

    gs.stdout
      .on('data', (data) => this.push(data))
      .on('error', (err) => this.destroy(err));

    gs.stderr
      .on('data', (data) => this.destroy(new Error(String(data))))
      .on('error', (err) => this.destroy(err));

    this.#stdin = gs.stdin;
    this.#stdout = gs.stdout;

    callback();
  }

  _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    if (this.#stdin.write(chunk, encoding)) {
      process.nextTick(callback);
    } else {
      this.#stdin.once('drain', callback);
    }
  }

  _flush(callback: TransformCallback) {
    this.#stdin.end();
    if (this.#stdout.destroyed) callback();
    else this.#stdout.on('close', () => callback());
  }
}
