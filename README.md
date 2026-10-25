# Space Craft website prototype

A static, responsive workplace design and build website with original Space Craft copy, red/white/black styling and clearly labeled illustrative photography.

## Pages

The route inventory in `scripts/page-coverage.json` maps all 440 subpage URLs in OfficeBanao's public sitemap to Space Craft equivalents. The expanded site also includes service details, an all-pages directory, location and concept indexes, and a 404 page.

Company content, concept studies, service pages, contact, careers and partner journeys use page-specific layouts. The journal and quick-read libraries use shared editorial templates and original topic-based planning notes. Illustrative concepts do not assert client work or credentials. Location pages do not assert delivery capability in those locations.

## Forms

Project inquiries, career interests and partner profiles are demos. They validate input and generate downloadable text briefs in the current browser tab. Nothing is submitted to a server or emailed.

## Address

18, Buddha Vihara Rd, Cox Town, Bengaluru, Karnataka 560005

The address appears on the contact page and shared footer, with an external Google Maps search link.

## Preview and verification

Serve `dist/` with a static HTTP server. Run `python3 scripts/check-site.py` to validate internal links, fragment targets, local assets, headings and address coverage. The site has no build dependency or backend.

Photos are illustrative Unsplash assets, served locally. The private ChatGPT Sites deployment handles access independently of the website's demo interactions.
