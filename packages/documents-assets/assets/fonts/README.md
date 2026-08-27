# Polices des documents officiels

Les sept fichiers ci-dessous sont **versionnés** dans ce dossier. Ils sont inlinés en base64 dans
le CSS du document par `documentFontFaces()`, pour que le document soit lisible à l'identique
par le navigateur de l'utilisateur et par le Chromium qui l'imprime en PDF.

| Fichier                     | Famille    | Style   | Graisse | Usage                                   |
| --------------------------- | ---------- | ------- | ------- | --------------------------------------- |
| `NotoSans-Regular.woff2`    | Noto Sans  | normal  | 400     | corps du document                       |
| `NotoSans-Italic.woff2`     | Noto Sans  | italic  | 400     | la ligne de formation                   |
| `NotoSans-SemiBold.woff2`   | Noto Sans  | normal  | 600     | les `<strong>` dans les propositions    |
| `NotoSans-Bold.woff2`       | Noto Sans  | normal  | 700     | la phrase d'introduction                |
| `Montserrat-SemiBold.woff2` | Montserrat | normal  | 600     | réserve, titres secondaires             |
| `Montserrat-Bold.woff2`     | Montserrat | normal  | 700     | titres de section du PV (`font-weight: bold`) |
| `Montserrat-Black.woff2`    | Montserrat | normal  | 900     | titre du document, sous-titre doré      |

Sources officielles, licence SIL Open Font :
[Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans) et
[Montserrat](https://fonts.google.com/specimen/Montserrat).

Tant qu'un fichier manque, `pnpm --filter documents-assets test` échoue en le nommant.
