# App design images

Put photos used in the app UI here (About page, banners, backgrounds, ministry graphics, etc.).

## How to add photos

1. Open this folder on GitHub: `TBC-APP/images/`
2. Click **Add file** → **Upload files**
3. Drag in your photos (JPG or PNG works best)
4. Click **Commit changes**

## Naming tips

Use simple names with no spaces:

- `about-church.jpg`
- `home-banner.jpg`
- `kids-ministry.jpg`
- `worship.jpg`

## Using a photo in a page

From a root page like `about.html`:

```html
<img src="images/about-church.jpg" alt="Temple Baptist Church">
```

From a deeper page (e.g. Bible), use the correct relative path:

```html
<img src="../../images/about-church.jpg" alt="Temple Baptist Church">
```

## Notes

- Keep files under about **1–2 MB** each so pages load fast on phones.
- Prefer **JPG** for photos and **PNG** for logos/graphics with transparency.
- Church family event photos still belong in **Church Photos** in the app (Firebase), not here.
