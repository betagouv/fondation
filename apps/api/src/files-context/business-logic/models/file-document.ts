export type FileS3ProviderName = 'outscale';

export type FileDocumentSnapshot = {
  id: string;
  createdAt: Date;
  name: string;
  provider: FileS3ProviderName;
  uri: string;
};

export class FileDocument {
  constructor(
    private readonly id: string,
    private readonly createdAt: Date,
    private readonly name: string,
    private readonly provider: FileS3ProviderName,
    private readonly uri: string,
  ) {}

  toSnapshot(): FileDocumentSnapshot {
    return {
      id: this.id,
      createdAt: this.createdAt,
      name: this.name,
      provider: this.provider,
      uri: this.uri,
    };
  }
}
