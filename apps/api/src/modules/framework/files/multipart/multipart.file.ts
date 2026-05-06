import { File, type FileOptions } from 'node:buffer';

import { FILE_MIME_TYPES, FileMimeType, isMimeType } from '../mime-type';

export class MultipartFile extends File {
  readonly id: string;
  readonly path: string | null;
  readonly overrideFiles: boolean;
  readonly deleteOnFail: boolean;
  readonly mimeType: FileMimeType;

  constructor(props: {
    buffers: Buffer[];
    filename: string;
    options: FileOptions & {
      id: string;
      path: string | null;
      overrideFiles: boolean;
      deleteOnFail: boolean;
    };
  }) {
    const { overrideFiles, deleteOnFail, path, id, ...fileOptions } = props.options;

    super(props.buffers, props.filename, fileOptions);

    this.id = id;
    this.mimeType = isMimeType(fileOptions.type) ? fileOptions.type : FILE_MIME_TYPES.bin;
    this.path = path;
    this.deleteOnFail = deleteOnFail;
    this.overrideFiles = overrideFiles;
  }

  clone(buffers: Buffer[]): MultipartFile {
    return new MultipartFile({
      buffers,
      filename: this.name,
      options: {
        id: this.id,
        path: this.path,
        overrideFiles: this.overrideFiles,
        deleteOnFail: this.deleteOnFail,
        type: this.mimeType,
        lastModified: this.lastModified,
      },
    });
  }
}
