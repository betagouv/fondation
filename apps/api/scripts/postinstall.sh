#!/bin/bash

###                                                ###
# Script run after package installations in SCALINGO #
###                                                ###

# @see build-for-scalingo.sh
echo 'POST INSTALL SCRIPT' && \
  node apps/api/node_modules/puppeteer/install.mjs && \
  mv -v /usr/share/fonts/truetype/noto/NotoSans-*.ttf /usr/share/fonts/truetype && \
  rm -v /usr/share/fonts/truetype/noto/*.ttf && \
  mv -v /usr/share/fonts/truetype/NotoSans-*.ttf /usr/share/fonts/truetype/noto && \
  rm -v -rf /usr/share/fonts/opentype/montserrat && \
  rm -v -rf /usr/share/fonts/truetype/montserrat && \
  rm -v -f /usr/share/fonts/woff/montserrat/MontserratAlternates-*.{woff,woff2} && \
  echo 'POST INSTALL DONE'

