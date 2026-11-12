# Modèles vierges pour le métier

Le métier écrit ses propres documents avec l'habillage des ODJ et des PV de Fondation (logo du CSM, filet tricolore, polices et styles). Ce dossier produit les fichiers qui lui sont remis.

| Fichier                   | Usage                                                          |
| ------------------------- | -------------------------------------------------------------- |
| `modele-vierge-csm.dotx`  | modèle Word, chaque double-clic ouvre un nouveau document      |
| `modele-vierge-csm.docx`  | le même modèle en document Word classique                      |
| `exemple-styles-csm.docx` | une page qui montre chaque style                               |
| `modele-vierge-csm.pdf`   | la page vierge en PDF, rendue comme les documents de Fondation |

Ces fichiers ne sont pas versionnés. Ils se refont quand le logo, les couleurs ou les styles des documents changent.

## Les polices

Les polices de `../assets/fonts` ne contiennent que les caractères dont Fondation a besoin et la famille Montserrat y porte un mauvais nom. Dans Word, le métier tape ce qu'il veut et un nom comme Łukasz ou Dvořák changerait de police au milieu du mot. Elles ne sont pas complétées pour autant puisqu'elles sont recopiées dans chaque document généré par Fondation.

Les fichiers de `fonts/` viennent donc des polices officielles de Google Fonts (licence SIL Open Font). Leurs graisses sont figées, seuls les caractères latins sont gardés et les noms de famille sont corrigés pour Word.

Les refaire n'est utile que si l'on change de police ou de graisse. Sous Debian et Ubuntu, il faut d'abord installer le paquet `python3-venv`.

```sh
TMP=$(mktemp -d)
for f in 'montserrat/Montserrat[wght].ttf' 'notosans/NotoSans[wdth,wght].ttf' 'notosans/NotoSans-Italic[wdth,wght].ttf'; do
  curl -sfL "https://raw.githubusercontent.com/google/fonts/5bb28733cec313b63fbd415b574b5ae35c8aa8b8/ofl/$(echo $f | sed 's/\[/%5B/;s/\]/%5D/')" -o "$TMP/$(basename $f)"
done
python3 -m venv "$TMP/venv" && "$TMP/venv/bin/pip" install -q fonttools==4.68.0
"$TMP/venv/bin/python" make-fonts.py "$TMP"
rm -rf "$TMP"
```

## Les fichiers Word

La bibliothèque `docx` ne dessine aucune forme. Le filet tricolore est donc un tableau sans bordure dont la première et la dernière cellule portent une bordure haute colorée. Elle n'intègre pas non plus les graisses grasses et italiques. Le script ajoute ensuite lui-même les sept polices au fichier, ce qui évite au métier de les installer.

Le logo vient de `../assets/logo-csm.svg`. `logo-csm.png` n'en est que la version de secours pour les Word d'avant 2016 qui n'affichent pas le SVG. Il se refait avec Gotenberg si le logo change en gardant `height` égal à 1000 fois la hauteur divisée par la largeur du `viewBox` du SVG.

```sh
TMP=$(mktemp -d)
printf '<!doctype html><html><head><style>html,body{margin:0}svg{display:block;width:1000px}</style></head><body>%s</body></html>' "$(cat ../assets/logo-csm.svg)" > "$TMP/index.html"
curl -sf -X POST http://localhost:9091/forms/chromium/screenshot/html -F "files=@$TMP/index.html" -F width=1000 -F height=822 -F format=png -F omitBackground=true -o logo-csm.png
rm -rf "$TMP"
```

Les dépendances s'installent le temps de la génération, hors du projet.

```sh
TMP=$(mktemp -d)
npm install --prefix "$TMP" --silent docx@9.5.1 jszip@3.10.1
NODE_PATH="$TMP/node_modules" node make-word.cjs ~/Downloads
rm -rf "$TMP"
```

## Le PDF

Le script reprend la page de `apps/api/src/modules/docs/shared/infrastructure/services/renderers/common.html.ts` sans numéro de page. Il faut le mettre à jour si cette page change. Il demande Gotenberg démarré en local et le paquet construit (`pnpm --filter documents-assets build`).

```sh
node make-pdf.cjs ~/Downloads
```

## Vérifier

- Ouvrir `exemple-styles-csm.docx` dans Word et dans LibreOffice. Le titre doit être en Montserrat épais et le texte en Noto Sans, même sur un poste où ces polices ne sont pas installées
- Word en français retire les accents des titres mis en majuscules par le style sauf si l'option "Majuscules accentuées en français" est cochée sur le poste
- Pas de `.doc` qui perd les polices et une partie du texte sous LibreOffice
