# LinkedIn brand assets

Generated from the site's own font (`dist/assets/sora-variable.ttf`) and hero photo (`dist/assets/hero-after.webp`).

| File | Use |
|---|---|
| `spacecraft-linkedin-cover-2256x382.png` | Company-page cover (upload this; 2× of LinkedIn's 1128×191) |
| `spacecraft-linkedin-cover-1128x191.png` | Company-page cover at exact size |
| `spacecraft-linkedin-logo-1200.png` / `-400.png` | Square logo, "sc" monogram (recommended; matches the favicon) |
| `spacecraft-linkedin-logo-wordmark-1200.png` / `-400.png` | Square logo, full wordmark (alternative) |

Regenerate from the repo root:

    python3 brand/linkedin/make_cover.py dist brand/linkedin
    python3 brand/linkedin/make_logo.py dist brand/linkedin
