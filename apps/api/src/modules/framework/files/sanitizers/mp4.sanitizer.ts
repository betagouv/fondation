import { Transform, type Duplex, type TransformCallback } from 'node:stream';

import { FILE_MIME_TYPES, type FileMimeType } from '../mime-type';

import { type FileSanitizer } from './sanitizer';

type Box = { content: number; end: number; start: number; type: string };

const CONTAINERS_OF_CHUNK_OFFSETS = new Set(['mdia', 'minf', 'moov', 'stbl', 'trak']);

function boxesOf(mp4: Buffer, start: number, end: number): Box[] {
  const boxes: Box[] = [];
  let offset = start;
  while (offset + 8 <= end) {
    const size = mp4.readUInt32BE(offset);
    const isLarge = size === 1 && offset + 16 <= end;
    const header = isLarge ? 16 : 8;
    const length = isLarge ? Number(mp4.readBigUInt64BE(offset + 8)) : size === 0 ? end - offset : size;
    if (length < header || offset + length > end) break;

    boxes.push({
      content: offset + header,
      end: offset + length,
      start: offset,
      type: mp4.toString('latin1', offset + 4, offset + 8),
    });
    offset += length;
  }
  return boxes;
}

/** the index locates every chunk of media data from the start of the file */
function shiftChunkOffsets(moov: Buffer, shift: (offset: number) => number): void {
  const visit = (start: number, end: number) => {
    for (const box of boxesOf(moov, start, end)) {
      if (CONTAINERS_OF_CHUNK_OFFSETS.has(box.type)) visit(box.content, box.end);
      else if ((box.type === 'stco' || box.type === 'co64') && box.end - box.content >= 8) {
        // a version and flags (4 bytes) come before the count of chunks
        const width = box.type === 'stco' ? 4 : 8;
        const count = moov.readUInt32BE(box.content + 4);
        for (let i = 0, at = box.content + 8; i < count && at + width <= box.end; i++, at += width) {
          if (width === 4) moov.writeUInt32BE(shift(moov.readUInt32BE(at)), at);
          else moov.writeBigUInt64BE(BigInt(shift(Number(moov.readBigUInt64BE(at)))), at);
        }
      }
    }
  };
  const [root] = boxesOf(moov, 0, moov.length);
  if (root) visit(root.content, root.end);
}

/**
 * a browser reads the index of a video (moov) before showing its first image: written after the media data (mdat),
 * as most recorders do, it costs one more request through the API for every video of a page
 */
export function moveIndexToStart(mp4: Buffer): Buffer[] {
  const boxes = boxesOf(mp4, 0, mp4.length);
  const moov = boxes.find(({ type }) => type === 'moov');
  const firstMdat = boxes.find(({ type }) => type === 'mdat');
  // a file we do not fully understand, or fragmented for streaming, is kept as sent
  if (
    !moov ||
    !firstMdat ||
    moov.start < firstMdat.start ||
    boxes.at(-1)?.end !== mp4.length ||
    boxes.some(({ type }) => type === 'moof')
  ) {
    return [mp4];
  }

  // a shifted offset stays below the length of the file, which the upload caps far under the 4 GiB of an stco table
  const moved = Buffer.from(mp4.subarray(moov.start, moov.end));
  shiftChunkOffsets(moved, (offset) =>
    offset >= firstMdat.start && offset < moov.start ? offset + moved.length : offset,
  );

  // the parts are pushed as they are: the uploads of a request are sanitized together, a copy of each would add up
  return [
    mp4.subarray(0, firstMdat.start),
    moved,
    mp4.subarray(firstMdat.start, moov.start),
    mp4.subarray(moov.end),
  ];
}

class Mp4IndexTransform extends Transform {
  readonly #chunks: Buffer[] = [];

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback) {
    this.#chunks.push(chunk);
    callback();
  }

  _flush(callback: TransformCallback) {
    for (const part of moveIndexToStart(Buffer.concat(this.#chunks))) this.push(part);
    callback();
  }
}

export class Mp4Sanitizer implements FileSanitizer {
  handles(mimeType: FileMimeType): boolean {
    return mimeType === FILE_MIME_TYPES.mp4;
  }

  sanitize(): Duplex {
    return new Mp4IndexTransform();
  }
}
