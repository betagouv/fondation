#!/bin/bash

###                                                ###
# Script run after package installations in SCALINGO #
###                                                ###

# @see build-for-scalingo.sh
echo 'POST INSTALL SCRIPT' && \
  node apps/api/node_modules/puppeteer/install.mjs && \
  mv -v .apt/usr/share/fonts/truetype/noto/NotoSans-*.ttf .apt/usr/share/fonts/truetype && \
  rm -v .apt/usr/share/fonts/truetype/noto/*.ttf && \
  mv -v .apt/usr/share/fonts/truetype/NotoSans-*.ttf .apt/usr/share/fonts/truetype/noto && \
  rm -v -rf .apt/usr/share/fonts/opentype/montserrat && \
  rm -v -rf .apt/usr/share/fonts/truetype/montserrat && \
  rm -v -f .apt/usr/share/fonts/woff/montserrat/MontserratAlternates-*.{woff,woff2} && \
  fc-cache -f && \
  echo 'POST INSTALL DONE' && \
  rm -vrf apps/api/scripts
