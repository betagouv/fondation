import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { LolfiNode, LolfiXmlSaxParser } from './lolfi-xml-sax-parser';

describe('LOLFI XML Parser', () => {
  const xml = `
    <?xml version="1.0" encoding="ISO-8859-1" ?>
    <lolfi>
      <entity id="1">
        <id>1001</id>
        <name>HANNAH ARENDT</name>
        <birth_year>1906</birth_year>
        <role null="TRUE" />
      </entity>
      <entity id="2">
        <id>1002</id>
        <name>ANTONIO GRAMSCI</name>
        <birth_year>1891</birth_year>
        <role>ADMIN</role>
      </entity>
    </lolfi>
  `;

  function collect<T>(array: T[]) {
    return async function* (source: AsyncIterable<T>) {
      for await (const item of source) array.push(item);
    };
  }

  it('should parse any xml stream', async () => {
    const parser = new LolfiXmlSaxParser({ tag: 'entity' });

    const destination: LolfiNode[] = [];
    await pipeline(Readable.from(xml), parser, collect(destination));

    expect(destination).toEqual([
      {
        name: 'entity',
        attributes: { id: '1' },
        content: null,
        // prettier-ignore
        children: [
          { name: 'id', content: '1001', attributes: {}, children: [] },
          { name: 'name', content: 'HANNAH ARENDT', attributes: {}, children: [] },
          { name: 'birth_year', content: '1906', attributes: {}, children: [] },
          { name: 'role', content: null, attributes: {}, children: [] },
        ],
      },
      {
        name: 'entity',
        attributes: { id: '2' },
        content: null,
        // prettier-ignore
        children: [
          { name: 'id', content: '1002', attributes: {}, children: [] },
          { name: 'name', content: 'ANTONIO GRAMSCI', attributes: {}, children: [] },
          { name: 'birth_year', content: '1891', attributes: {}, children: [] },
          { name: 'role', content: 'ADMIN', attributes: {}, children: [] },
        ],
      },
    ]);
  });
});
