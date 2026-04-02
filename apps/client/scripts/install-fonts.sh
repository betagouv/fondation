#!/bin/bash

FONT_DIR=apps/client/src/assets/fonts;

mkdir -p "$FONT_DIR";
cd "$FONT_DIR"

for font in Regular Italic Bold BoldItalic; do
  curl --silent -L -o "NotoSans-$font.ttf" "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/hinted/ttf/NotoSans-$font.ttf"
done


curl --silent -L -o Montserrat.tar.gz https://github.com/JulietaUla/Montserrat/archive/refs/tags/v7.222.tar.gz

if tar --version 2>&1 | grep -q 'GNU tar'; then # MacOS uses bsdtar
  tar -xzvf Montserrat.tar.gz --wildcards '*/fonts/webfonts/Montserrat-*.woff2' --strip-components=3
else
  tar -xzvf Montserrat.tar.gz --include='*/fonts/webfonts/Montserrat-*.woff2' --strip-components=3
fi

rm Montserrat.tar.gz

cd -;