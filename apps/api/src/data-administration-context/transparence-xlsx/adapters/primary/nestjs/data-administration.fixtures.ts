import {
  genDossierSiège,
  genTransparenceXlsxBuffer,
  genUneTransparence,
} from 'src/data-administration-context/transparence-xlsx/business-logic/use-cases/fixtures';

export const unNomTransparenceXlsx = 'transparence.xlsx';
export const uneTransparenceXlsxBuffer = genTransparenceXlsxBuffer();
const unDossierSiège = genDossierSiège();
export const uneTransparence = genUneTransparence(unDossierSiège);
