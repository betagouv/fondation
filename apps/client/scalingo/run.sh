#!/bin/bash

mkdir -p ./dist/assets/fonts
cp /usr/share/fonts/truetype/noto/NotoSans-*.ttf ./dist/assets/fonts;
cp /usr/share/fonts/woff/montserrat/Montserrat-*.woff2 ./dist/assets/fonts;

bin/run