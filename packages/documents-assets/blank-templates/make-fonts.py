import sys
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

if len(sys.argv) != 2:
    sys.exit('Usage: python make-fonts.py <directory of the Google Fonts variable fonts>')

downloads = Path(sys.argv[1])
output = Path(__file__).parent / 'fonts'

# OS/2 fsSelection bits
ITALIC = 1 << 0
BOLD = 1 << 5
REGULAR = 1 << 6

LATIN = (
    list(range(0x20, 0x7F))
    + list(range(0xA0, 0x250))
    + list(range(0x300, 0x370))
    + list(range(0x1E00, 0x1F00))
    + list(range(0x2000, 0x2070))
    + [0x20AC, 0x2116, 0x2122, 0xFB01, 0xFB02]
)

FACES = [
    ('Montserrat[wght].ttf', {'wght': 400}, 'Montserrat', 'Regular'),
    ('Montserrat[wght].ttf', {'wght': 700}, 'Montserrat', 'Bold'),
    ('Montserrat[wght].ttf', {'wght': 900}, 'Montserrat Black', 'Regular'),
    ('NotoSans[wdth,wght].ttf', {'wdth': 100, 'wght': 400}, 'Noto Sans', 'Regular'),
    ('NotoSans[wdth,wght].ttf', {'wdth': 100, 'wght': 700}, 'Noto Sans', 'Bold'),
    ('NotoSans-Italic[wdth,wght].ttf', {'wdth': 100, 'wght': 400}, 'Noto Sans', 'Italic'),
    ('NotoSans-Italic[wdth,wght].ttf', {'wdth': 100, 'wght': 700}, 'Noto Sans', 'Bold Italic'),
]

for source, axes, family, style in FACES:
    font = instantiateVariableFont(TTFont(downloads / source), axes, updateFontNames=False)

    options = Options()
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.notdef_outline = True
    subsetter = Subsetter(options)
    subsetter.populate(unicodes=LATIN)
    subsetter.subset(font)

    # Word finds a face by its family name (nameID 1) and its style (nameID 2)
    postscript = f"{family.replace(' ', '')}-{style.replace(' ', '')}"
    full = family if style == 'Regular' else f'{family} {style}'
    name = font['name']
    for record_id in (16, 17, 21, 22, 25):
        name.removeNames(nameID=record_id)
    for record_id, value in {1: family, 2: style, 3: f'{postscript};CSM', 4: full, 6: postscript}.items():
        name.setName(value, record_id, 3, 1, 0x409)
        name.setName(value, record_id, 1, 0, 0)

    bold = 'Bold' in style
    italic = 'Italic' in style
    os2 = font['OS/2']
    os2.usWeightClass = axes['wght']
    os2.fsType = 0
    os2.fsSelection = (
        (os2.fsSelection & ~(ITALIC | BOLD | REGULAR))
        | (BOLD if bold else 0)
        | (ITALIC if italic else 0)
        | (0 if bold or italic else REGULAR)
    )
    font['head'].macStyle = (1 if bold else 0) | (2 if italic else 0)

    path = output / f'{postscript}.ttf'
    font.save(path)
    print(path)
