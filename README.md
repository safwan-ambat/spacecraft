# Space Craft website

A static, responsive workplace design and build website with original Space Craft copy and Unsplash photography.

## Pages

The route inventory in `scripts/page-coverage.json` maps all 440 subpage URLs in OfficeBanao's public sitemap to Space Craft equivalents. The expanded site also includes service details, an all-pages directory, location and concept indexes, and a 404 page.

Company content, concept studies, service pages, contact, careers and partner journeys use page-specific layouts. The journal and quick-read libraries use shared editorial templates and original topic-based planning notes.

## Forms

The project enquiry, career and partner forms post to a Google Apps Script web app that appends each submission to a private Google Sheet ("Space Craft — Website enquiries", tab "Enquiries"). The script is in `scripts/google-sheet-endpoint.gs`; the web app address is the single `ENQUIRY_ENDPOINT` constant in `dist/enquiry.js`. Forms validate in the browser, include a hidden spam-trap field, and the script re-validates and caps every field. To change the endpoint, redeploy the script as a new web app version and update that constant.

## Address

18, Buddha Vihara Rd, Cox Town, Bengaluru, Karnataka 560005

The address appears on the contact page and shared footer, with an external Google Maps search link.

## Preview and verification

Serve `dist/` with a static HTTP server. Run `python3 scripts/check-site.py` to validate internal links, fragment targets, local assets, headings and address coverage. The site has no build dependency or backend.

`scripts/build-pages.py` regenerates the subpages. It reads the sitemap exports and `home-before-subpages.html` from the folder above this repository.

Photos are Unsplash assets, served locally from `dist/assets/`. The logo is live text set in Sora. `scripts/make-brand-assets.py` renders the favicon set and the social share image (`dist/og-image.jpg`) from the Sora font and the hero photo.

## Deployment

Vercel serves `dist/` directly (see `vercel.json`); there is no build step. The production domain is www.withspacecraft.com.
