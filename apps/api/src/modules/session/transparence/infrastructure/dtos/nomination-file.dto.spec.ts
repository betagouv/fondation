import { RecuseNominationFilesMembersDto } from './nomination-file.dto';

describe('RecuseNominationFilesMembersDto', () => {
  const FILE = '0b5c3a64-6a4f-4d5e-9a57-1f0e6c2a9b11';
  const OTHER_FILE = '5f1d2c3b-7e8a-4b9c-8d0e-2a3b4c5d6e7f';
  const MEMBER = '9c8b7a65-4d3e-4f2a-8b1c-0d9e8f7a6b5c';

  it('accepts each file once', () => {
    const items = [
      { memberIds: [MEMBER], nominationFileId: FILE },
      { memberIds: [], nominationFileId: OTHER_FILE },
    ];

    expect(RecuseNominationFilesMembersDto.schema.safeParse({ items }).success).toBe(true);
  });

  it('refuses a file sent twice, whose two lists would otherwise merge silently', () => {
    const items = [
      { memberIds: [MEMBER], nominationFileId: FILE },
      { memberIds: [], nominationFileId: FILE },
    ];

    expect(RecuseNominationFilesMembersDto.schema.safeParse({ items }).success).toBe(false);
  });
});
