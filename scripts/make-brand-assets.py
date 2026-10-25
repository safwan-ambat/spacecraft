"""Render the favicon set and the social share image from the Sora wordmark and the hero photo."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / 'dist'
SORA = str(D / 'assets' / 'sora-variable.ttf')
INK, RED, WHITE = (1, 21, 29), (196, 46, 36), (255, 255, 255)
RED_ON_DARK = (232, 76, 61)


def sora(size, weight):
    font = ImageFont.truetype(SORA, size)
    font.set_variation_by_axes([weight])
    return font


def draw_word(draw, xy, parts, font, tracking):
    """Draw coloured text runs left to right with a tracking adjustment (negative tightens)."""
    x, y = xy
    for text, colour in parts:
        for ch in text:
            draw.text((x, y), ch, font=font, fill=colour)
            x += draw.textlength(ch, font=font) + tracking
    return x


def word_width(draw, text, font, tracking):
    return sum(draw.textlength(ch, font=font) + tracking for ch in text) - tracking


def icon(size, radius=220):
    """Navy square with a bold "sc" in white and red, rendered large and scaled down for crisp edges."""
    s = 1024
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, s - 1, s - 1), radius=radius, fill=INK)
    font = sora(600, 700)
    track = -40
    w = word_width(d, 'sc', font, track)
    top, bottom = font.getbbox('sc')[1], font.getbbox('sc')[3]
    draw_word(d, ((s - w) / 2, (s - (bottom - top)) / 2 - top), [('s', WHITE), ('c', RED_ON_DARK)], font, track)
    return img.resize((size, size), Image.LANCZOS)


def share_image():
    W, H = 1200, 630
    photo = Image.open(D / 'assets' / 'hero-after.webp').convert('RGB')
    scale = max(W / photo.width, H / photo.height)
    photo = photo.resize((round(photo.width * scale), round(photo.height * scale)), Image.LANCZOS)
    left, top = (photo.width - W) // 2, (photo.height - H) // 2
    img = photo.crop((left, top, left + W, top + H))
    # Left-to-right navy shade so the type reads over the photo.
    shade = Image.new('L', (W, 1))
    for x in range(W):
        shade.putpixel((x, 0), int(235 * max(0, 1 - x / (W * .78)) ** 1.4))
    img = Image.composite(Image.new('RGB', (W, H), INK), img, shade.resize((W, H)))
    d = ImageDraw.Draw(img)
    pad = 72
    draw_word(d, (pad, 64), [('space', WHITE), ('craft', RED_ON_DARK)], sora(52, 700), -3)
    d.text((pad + 2, 128), 'WORKPLACE DESIGN & BUILD', font=sora(15, 600), fill=(255, 255, 255, 220), spacing=0)
    headline = sora(84, 700)
    d.text((pad, 300), 'Make room', font=headline, fill=WHITE)
    d.text((pad, 386), 'for better work.', font=headline, fill=WHITE)
    d.text((pad + 2, 520), 'withspacecraft.com', font=sora(24, 400), fill=(225, 232, 235))
    return img


if __name__ == '__main__':
    icon(256).save(D / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    icon(32).save(D / 'favicon-32.png')
    icon(180, radius=0).convert('RGB').save(D / 'apple-touch-icon.png')  # iOS rounds the corners itself
    icon(512).save(D / 'icon-512.png')
    share_image().save(D / 'og-image.jpg', quality=86, optimize=True, progressive=True)
    print('wrote favicon.ico, favicon-32.png, apple-touch-icon.png, icon-512.png, og-image.jpg')
