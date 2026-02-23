export type LolfiJob = {
  id: number;
  files: {
    id: string;
    name: string;
    sha256: string;
    lastSha256: string | undefined;
  }[];
};

export class LolfiJobFileNotFoundError extends Error {
  constructor(readonly file: string) {
    super();
  }
}
