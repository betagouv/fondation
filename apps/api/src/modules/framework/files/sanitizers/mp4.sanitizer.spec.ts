import { moveIndexToStart } from './mp4.sanitizer';

function box(type: string, ...content: Buffer[]): Buffer {
  const body = Buffer.concat(content);
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + body.length);
  header.write(type, 4, 'latin1');
  return Buffer.concat([header, body]);
}

function largeBox(type: string, ...content: Buffer[]): Buffer {
  const body = Buffer.concat(content);
  const header = Buffer.alloc(16);
  header.writeUInt32BE(1);
  header.write(type, 4, 'latin1');
  header.writeBigUInt64BE(BigInt(16 + body.length), 8);
  return Buffer.concat([header, body]);
}

function chunkOffsets(type: 'co64' | 'stco', offsets: readonly number[]): Buffer {
  const width = type === 'stco' ? 4 : 8;
  const table = Buffer.alloc(8 + offsets.length * width);
  table.writeUInt32BE(offsets.length, 4);
  offsets.forEach((offset, i) => {
    if (width === 4) table.writeUInt32BE(offset, 8 + i * width);
    else table.writeBigUInt64BE(BigInt(offset), 8 + i * width);
  });
  return box(type, table);
}

function moovWith(type: 'co64' | 'stco', offsets: readonly number[]): Buffer {
  return box('moov', box('trak', box('mdia', box('minf', box('stbl', chunkOffsets(type, offsets))))));
}

function chunksOf(mp4: Buffer): string[] {
  const at = mp4.indexOf('stco') === -1 ? mp4.indexOf('co64') : mp4.indexOf('stco');
  const width = mp4.toString('latin1', at, at + 4) === 'stco' ? 4 : 8;
  const count = mp4.readUInt32BE(at + 8);

  return Array.from({ length: count }, (_, i) => {
    const offset =
      width === 4 ? mp4.readUInt32BE(at + 12 + i * 4) : Number(mp4.readBigUInt64BE(at + 12 + i * 8));
    return mp4.toString('latin1', offset, offset + 6);
  });
}

function typesOf(mp4: Buffer): string[] {
  const types: string[] = [];
  for (let offset = 0; offset < mp4.length; offset += mp4.readUInt32BE(offset)) {
    types.push(mp4.toString('latin1', offset + 4, offset + 8));
  }
  return types;
}

describe('moveIndexToStart', () => {
  const ftyp = box('ftyp', Buffer.from('isom'));
  const mdat = box('mdat', Buffer.from('chunkAchunkB'));
  const offsets = [ftyp.length + 8, ftyp.length + 14];

  it.each(['stco', 'co64'] as const)(
    'moves the index before the media data and keeps every %s offset on its chunk',
    (type) => {
      const recorded = Buffer.concat([ftyp, mdat, moovWith(type, offsets)]);

      const moved = Buffer.concat(moveIndexToStart(recorded));

      expect(typesOf(moved)).toEqual(['ftyp', 'moov', 'mdat']);
      expect(chunksOf(moved)).toEqual(['chunkA', 'chunkB']);
    },
  );

  it('reads an index whose boxes carry their size on 64 bits', () => {
    const moov = largeBox(
      'moov',
      box('trak', box('mdia', box('minf', largeBox('stbl', chunkOffsets('stco', offsets))))),
    );
    const recorded = Buffer.concat([ftyp, mdat, moov]);

    expect(chunksOf(Buffer.concat(moveIndexToStart(recorded)))).toEqual(['chunkA', 'chunkB']);
  });

  it('keeps a video whose index already comes first', () => {
    const optimized = Buffer.concat([ftyp, moovWith('stco', offsets), mdat]);

    expect(moveIndexToStart(optimized)).toEqual([optimized]);
  });

  it('keeps a video it cannot read to the end', () => {
    const truncated = Buffer.concat([ftyp, mdat, moovWith('stco', offsets)]).subarray(0, -4);

    expect(moveIndexToStart(truncated)).toEqual([truncated]);
  });

  it('moves the index without reading past an offset table that announces more chunks than it holds', () => {
    const table = chunkOffsets('stco', offsets);
    table.writeUInt32BE(1000, 12);
    const corrupted = Buffer.concat([
      ftyp,
      mdat,
      box('moov', box('trak', box('mdia', box('minf', box('stbl', table))))),
    ]);

    expect(typesOf(Buffer.concat(moveIndexToStart(corrupted)))).toEqual(['ftyp', 'moov', 'mdat']);
  });
});
