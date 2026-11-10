const { randomUUID } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  LevelFormat,
  LineRuleType,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require('docx');
const JSZip = require('jszip');

const output = process.argv[2];
if (!output) throw new Error('Usage: node make-word.cjs <output directory>');

const CM = 567;
const COLORS = { bleuFrance: '000091', deepBlue: '334B6F', gold: 'C5AB67', rougeMarianne: 'E1000F' };
// Width of each third of the flag, measured on the PDF rendered by Fondation
const FLAG_SEGMENT = 740;
const LOGO_SVG = readFileSync(join(__dirname, '..', 'assets', 'logo-csm.svg'));

const FONTS = [
  { file: 'Montserrat-Regular.ttf', name: 'Montserrat', slot: 'embedRegular' },
  { file: 'Montserrat-Bold.ttf', name: 'Montserrat', slot: 'embedBold' },
  { file: 'MontserratBlack-Regular.ttf', name: 'Montserrat Black', slot: 'embedRegular' },
  { file: 'NotoSans-Regular.ttf', name: 'Noto Sans', slot: 'embedRegular' },
  { file: 'NotoSans-Bold.ttf', name: 'Noto Sans', slot: 'embedBold' },
  { file: 'NotoSans-Italic.ttf', name: 'Noto Sans', slot: 'embedItalic' },
  { file: 'NotoSans-BoldItalic.ttf', name: 'Noto Sans', slot: 'embedBoldItalic' },
];

const styles = {
  default: {
    document: { run: { font: 'Noto Sans', size: 19 } },
    heading1: {
      paragraph: { keepNext: true, spacing: { after: 120, before: 720 } },
      run: { allCaps: true, color: COLORS.gold, font: 'Montserrat Black', size: 24 },
    },
    heading2: {
      paragraph: { keepNext: true, spacing: { after: 220, before: 480 } },
      run: { bold: true, color: COLORS.gold, font: 'Montserrat', size: 26 },
    },
    title: {
      paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 0, before: 0 } },
      run: { allCaps: true, color: COLORS.deepBlue, font: 'Montserrat Black', size: 29 },
    },
  },
  paragraphStyles: [
    {
      id: 'Normal',
      name: 'Normal',
      paragraph: {
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 192, before: 0, line: 360, lineRule: LineRuleType.AT_LEAST },
      },
      run: { font: 'Noto Sans', size: 19 },
    },
    {
      basedOn: 'Normal',
      id: 'Subtitle',
      name: 'Subtitle',
      next: 'Normal',
      paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 0, before: 0, line: 280 } },
      quickFormat: true,
      run: { italics: true },
    },
    {
      basedOn: 'Normal',
      id: 'Date',
      name: 'Date',
      next: 'Normal',
      paragraph: { alignment: AlignmentType.LEFT, spacing: { after: 0, before: 120 } },
      quickFormat: true,
      run: { size: 21 },
    },
    {
      basedOn: 'Normal',
      id: 'Signature',
      name: 'Signature',
      paragraph: { alignment: AlignmentType.RIGHT, keepLines: true, spacing: { before: 1200 } },
      quickFormat: true,
    },
  ],
};

const numbering = {
  config: [
    {
      levels: [
        {
          alignment: AlignmentType.LEFT,
          format: LevelFormat.BULLET,
          level: 0,
          style: { paragraph: { indent: { hanging: 240, left: 480 } }, run: { font: 'Noto Sans' } },
          text: '-',
        },
      ],
      reference: 'dashes',
    },
  ],
};

function tinyParagraph() {
  return new Paragraph({
    children: [new TextRun({ size: 2 })],
    spacing: { after: 0, before: 0, line: 20, lineRule: LineRuleType.EXACT },
  });
}

function logo() {
  const [, , viewBoxWidth, viewBoxHeight] = LOGO_SVG.toString()
    .match(/viewBox="([^"]+)"/)[1]
    .split(' ')
    .map(Number);
  const width = (2.5 / 2.54) * 96;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new ImageRun({
        altText: { description: 'Conseil supérieur de la magistrature', name: 'Logo', title: 'Logo du CSM' },
        data: LOGO_SVG,
        fallback: { data: readFileSync(join(__dirname, 'logo-csm.png')), type: 'png' },
        transformation: { height: (width * viewBoxHeight) / viewBoxWidth, width },
        type: 'svg',
      }),
    ],
    spacing: { after: 480, before: 0 },
  });
}

// docx cannot draw shapes: the flag is a borderless table whose first and last cells carry a colored top border
function flag() {
  const none = { color: 'auto', size: 0, style: BorderStyle.NONE };
  const cell = (color) =>
    new TableCell({
      borders: {
        bottom: none,
        left: none,
        right: none,
        top: color ? { color, size: 6, style: BorderStyle.SINGLE } : none,
      },
      children: [tinyParagraph()],
      width: { size: FLAG_SEGMENT, type: WidthType.DXA },
    });

  return new Table({
    alignment: AlignmentType.CENTER,
    borders: {
      bottom: none,
      insideHorizontal: none,
      insideVertical: none,
      left: none,
      right: none,
      top: none,
    },
    columnWidths: [FLAG_SEGMENT, FLAG_SEGMENT, FLAG_SEGMENT],
    rows: [new TableRow({ children: [cell(COLORS.bleuFrance), cell(), cell(COLORS.rougeMarianne)] })],
    width: { size: FLAG_SEGMENT * 3, type: WidthType.DXA },
  });
}

function sample() {
  const p = (text, options = {}) =>
    new Paragraph({ children: [new TextRun({ text, ...options.run })], ...options.paragraph });
  const body =
    'Le Conseil supérieur de la magistrature, réuni en sa formation compétente, a examiné les propositions de nomination qui lui ont été soumises. Les rapporteurs désignés ont présenté leurs observations sur chacun des dossiers inscrits à l’ordre du jour.';

  return [
    p('AVIS DU CONSEIL SUPÉRIEUR DE LA MAGISTRATURE', { paragraph: { style: 'Title' } }),
    p('Formation compétente à l’égard des magistrats du siège', { paragraph: { style: 'Subtitle' } }),
    p('Ordre du jour', { paragraph: { style: 'Heading1' } }),
    p('Séance du 12 novembre 2026', { paragraph: { style: 'Date' } }),
    p('Sur la proposition du garde des Sceaux de nommer :', {
      paragraph: { spacing: { before: 720 } },
      run: { bold: true },
    }),
    p(body),
    p('Section du procès-verbal', { paragraph: { style: 'Heading2' } }),
    p(body),
    p('Premier point de la liste', { paragraph: { numbering: { level: 0, reference: 'dashes' } } }),
    p('Second point de la liste', { paragraph: { numbering: { level: 0, reference: 'dashes' } } }),
    p('Fait à Paris, le 12 novembre 2026', { paragraph: { spacing: { before: 720 } } }),
    p('Le président de la formation', { paragraph: { style: 'Signature' } }),
  ];
}

function build(withSample) {
  return new Document({
    creator: 'Conseil supérieur de la magistrature',
    numbering,
    sections: [
      {
        children: [logo(), ...(withSample ? sample() : [new Paragraph({})])],
        footers: { default: new Footer({ children: [flag(), tinyParagraph()] }) },
        properties: {
          page: {
            margin: {
              bottom: 4 * CM,
              footer: Math.round(1.9 * CM),
              left: 3 * CM,
              right: 3 * CM,
              top: 3 * CM,
            },
          },
        },
      },
    ],
    styles,
    title: 'Modèle CSM',
  });
}

// ECMA-376 font obfuscation: the first 32 bytes are XORed with the reversed bytes of the font key
function obfuscate(buffer, guid) {
  const key = guid
    .replace(/-/g, '')
    .match(/../g)
    .map((hex) => parseInt(hex, 16))
    .reverse();
  const result = Buffer.from(buffer);
  for (let i = 0; i < 32; i++) result[i] ^= key[i % 16];

  return result;
}

// docx only embeds a regular face and never sets embedTrueTypeFonts: the fonts are added to the package afterwards
async function embedFonts(buffer, asTemplate) {
  const zip = await JSZip.loadAsync(buffer);

  const families = new Map();
  const relationships = [];
  FONTS.forEach((font, index) => {
    const guid = randomUUID().toUpperCase();
    const id = `rIdFont${index + 1}`;
    const data = readFileSync(join(__dirname, 'fonts', font.file));
    zip.file(`word/fonts/font${index + 1}.odttf`, obfuscate(data, guid));
    relationships.push(
      `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/font${index + 1}.odttf"/>`,
    );
    families.set(font.name, [
      ...(families.get(font.name) ?? []),
      `<w:${font.slot} r:id="${id}" w:fontKey="{${guid}}"/>`,
    ]);
  });

  const entries = [...families].map(
    ([name, embeds]) =>
      `<w:font w:name="${name}"><w:charset w:val="00"/><w:family w:val="swiss"/><w:pitch w:val="variable"/>${embeds.join('')}</w:font>`,
  );
  zip.file(
    'word/fontTable.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:fonts xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${entries.join('')}</w:fonts>`,
  );
  zip.file(
    'word/_rels/fontTable.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships.join('')}</Relationships>`,
  );

  if (asTemplate) {
    const types = await zip.file('[Content_Types].xml').async('string');
    zip.file(
      '[Content_Types].xml',
      types.replace('wordprocessingml.document.main+xml', 'wordprocessingml.template.main+xml'),
    );
  }

  const settings = await zip.file('word/settings.xml').async('string');
  zip.file('word/settings.xml', settings.replace(/(<w:settings[^>]*>)/, '$1<w:embedTrueTypeFonts/>'));

  // Word has refused packages with folder entries when opened through a co-editing service
  const clean = new JSZip();
  for (const file of Object.values(zip.files).filter((entry) => !entry.dir)) {
    clean.file(file.name, await file.async('nodebuffer'), { createFolders: false });
  }

  return clean.generateAsync({ compression: 'DEFLATE', type: 'nodebuffer' });
}

async function main() {
  const targets = [
    { asTemplate: true, file: 'modele-vierge-csm.dotx', withSample: false },
    { asTemplate: false, file: 'modele-vierge-csm.docx', withSample: false },
    { asTemplate: false, file: 'exemple-styles-csm.docx', withSample: true },
  ];
  for (const target of targets) {
    const path = join(output, target.file);
    writeFileSync(path, await embedFonts(await Packer.toBuffer(build(target.withSample)), target.asTemplate));
    console.log(path);
  }
}

main();
