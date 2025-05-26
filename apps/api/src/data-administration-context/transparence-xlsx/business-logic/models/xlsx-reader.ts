import xlsx from 'node-xlsx';

type XlsxRead = {
  name: string;
  data: any[][];
}[];

export class XlsxReader {
  constructor(
    private readonly fileName: string,
    private readonly data: XlsxRead,
  ) {}

  getFileName() {
    return this.fileName;
  }
  getData() {
    return this.data[0]!.data;
  }

  static async read(file: File) {
    const buffer = xlsx.parse(await file.arrayBuffer());
    return new XlsxReader(file.name, buffer);
  }
}
