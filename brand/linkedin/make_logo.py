"""Square LinkedIn logos for Space Craft: the "sc" monogram (matches the site favicon) and a full-wordmark variant.

Run from the repo root:  python3 brand/linkedin/make_logo.py dist brand/linkedin
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

SITE, OUT = Path(sys.argv[1]), Path(sys.argv[2])
SORA = str(SITE / 'assets' / 'sora-variable.ttf')
INK, WHITE, RED_ON_DARK = (1, 21, 29), (255, 255, 255), (232, 76, 61)


def sora(size, weight):
    f = ImageFont.truetype(SORA, size)
    f.set_variation_by_axes([weight])
    return f


def centred_word(d, size_px, runs, font, tracking):
    """Draw coloured runs centred on the canvas, using the ink bounds of the whole word."""
    text = ''.join(t for t, _ in runs)
    w = sum(d.textlength(c, font=font) + tracking for c in text) - tracking
    top, bottom = font.getbbox(text)[1], font.getbbox(text)[3]
    x, y = (size_px - w) / 2, (size_px - (bottom - top)) / 2 - top
    for t, colour in runs:
        for c in t:
            d.text((x, y), c, font=font, fill=colour)
            x += d.textlength(c, font=font) + tracking


def monogram(size):
    S = 1600  # draw large, then downsample for crisp edges
    img = Image.new('RGB', (S, S), INK)
    d = ImageDraw.Draw(img)
    # Smaller than the favicon so it survives LinkedIn's rounded crop and reads at feed size.
    centred_word(d, S, [('s', WHITE), ('c', RED_ON_DARK)], sora(820, 700), -55)
    return img.resize((size, size), Image.LANCZOS)


def wordmark(size):
    S = 1600
    img = Image.new('RGB', (S, S), INK)
    d = ImageDraw.Draw(img)
    centred_word(d, S, [('space', WHITE), ('craft', RED_ON_DARK)], sora(250, 700), -15)
    return img.resize((size, size), Image.LANCZOS)


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for size in (400, 1200):
        monogram(size).save(OUT / f'spacecraft-linkedin-logo-{size}.png', optimize=True)
        wordmark(size).save(OUT / f'spacecraft-linkedin-logo-wordmark-{size}.png', optimize=True)
    print('done')
