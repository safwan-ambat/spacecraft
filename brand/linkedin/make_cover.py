"""LinkedIn company-page cover for Space Craft: hero photo, wordmark | divider | tagline.

Run from the repo root:  python3 brand/linkedin/make_cover.py dist brand/linkedin
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SITE = Path(sys.argv[1])                     # the repo's dist/ folder (read only)
OUT = Path(sys.argv[2])
SORA = str(SITE / 'assets' / 'sora-variable.ttf')
INK, WHITE, RED_ON_DARK = (1, 21, 29), (255, 255, 255), (232, 76, 61)


def sora(size, weight):
    f = ImageFont.truetype(SORA, size)
    f.set_variation_by_axes([weight])
    return f


def tracked(draw, xy, runs, font, tracking):
    x, y = xy
    for text, colour in runs:
        for ch in text:
            draw.text((x, y), ch, font=font, fill=colour)
            x += draw.textlength(ch, font=font) + tracking
    return x


def width(draw, text, font, tracking):
    return sum(draw.textlength(c, font=font) + tracking for c in text) - tracking


def cover(W, H, photo_name, focus_y):
    s = W / 1128                              # scale factor from the 1128x191 base
    photo = Image.open(SITE / 'assets' / photo_name).convert('RGB')
    k = W / photo.width
    photo = photo.resize((W, round(photo.height * k)), Image.LANCZOS)
    top = max(0, min(photo.height - H, round(photo.height * focus_y - H / 2)))
    img = photo.crop((0, top, W, top + H))

    # Navy tone: light on the left so the space reads, deep behind the type on the right.
    shade = Image.new('L', (W, 1))
    for x in range(W):
        t = x / W
        shade.putpixel((x, 0), int(255 * (0.30 + 0.52 * t ** 1.3)))
    img = Image.composite(Image.new('RGB', (W, H), INK), img, shade.resize((W, H)))
    # Soft vignette top and bottom.
    vig = Image.new('L', (1, H))
    for y in range(H):
        d = abs(y - H / 2) / (H / 2)
        vig.putpixel((0, y), int(90 * d ** 2))
    img = Image.composite(Image.new('RGB', (W, H), INK), img, vig.resize((W, H)))
    # Calm the window grid behind the type: blur rises from the left edge to the text, plus a soft dark pool there.
    soft = img.filter(ImageFilter.GaussianBlur(5 * s))
    ramp = Image.new('L', (W, 1))
    for x in range(W):
        ramp.putpixel((x, 0), int(255 * min(1, max(0, (x / W - 0.38) / 0.22))))
    img = Image.composite(soft, img, ramp.resize((W, H)))
    pool = Image.new('L', (W, H), 0)
    ImageDraw.Draw(pool).ellipse((round(W * 0.42), round(-H * 0.6), round(W * 0.92), round(H * 1.6)), fill=120)
    pool = pool.filter(ImageFilter.GaussianBlur(60 * s))
    img = Image.composite(Image.new('RGB', (W, H), INK), img, pool)

    d = ImageDraw.Draw(img)
    word = sora(round(46 * s), 700)
    track = -2.6 * s
    tag = sora(round(19 * s), 400)
    lines = ['Make room', 'for better work.']

    word_w = width(d, 'spacecraft', word, track)
    tag_w = max(d.textlength(l, font=tag) for l in lines)
    gap = round(22 * s)
    total = word_w + gap * 2 + tag_w
    cx = round(W * 0.66)                      # right of centre, clear of the logo overlay bottom-left
    x0 = round(cx - total / 2)

    bbox = word.getbbox('spacecraft')
    wy = round(H / 2 - (bbox[1] + bbox[3]) / 2)
    tracked(d, (x0, wy), [('space', WHITE), ('craft', RED_ON_DARK)], word, track)

    dx = round(x0 + word_w + gap)
    half = round(30 * s)
    d.line([(dx, H / 2 - half), (dx, H / 2 + half)], fill=(255, 255, 255, 150), width=max(1, round(1 * s)))

    lh = round(24 * s)
    ty = round(H / 2 - lh)
    for i, line in enumerate(lines):
        lb = tag.getbbox(line)
        d.text((dx + gap, ty + i * lh - lb[1] + round(2 * s)), line, font=tag, fill=(240, 244, 246))
    return img


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for scale, name in ((1, 'spacecraft-linkedin-cover-1128x191.png'), (2, 'spacecraft-linkedin-cover-2256x382.png')):
        cover(1128 * scale, 191 * scale, 'hero-after.webp', 0.42).save(OUT / name, optimize=True)
        print('wrote', OUT / name)
