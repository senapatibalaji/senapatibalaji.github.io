# Personal website: Balaji Senapati

A static site made of three files. There is no build step and nothing to install.

```
index.html     all page content
styles.css     design
script.js      navigation, publication filter, animated hero background
assets/        photo.jpeg and Balaji_Senapati_CV.pdf
```

To preview the site, double-click `index.html`.

## Before publishing

1. **Photo:** `assets/photo.jpeg`, shown in a square frame. To replace it, keep the same file name and use a square image of at least 700×700 px so it stays sharp on high-resolution screens. If the file is missing, a "BS" monogram is shown.
2. **CV:** in Word, go to *File → Save As → PDF* and save it as `assets/Balaji_Senapati_CV.pdf`. The "Download CV" button links to this file and stays hidden on the live site until the file exists. The CV includes your referees' email addresses, so you may want to remove that section from the public copy.

## Publish free on GitHub Pages

1. On GitHub, create a **public** repository named exactly `senapatibalaji.github.io`.
2. Upload `index.html`, `styles.css`, `script.js` and the `assets/` folder. Do not upload `CV.docx`.
3. Go to *Settings → Pages* and set *Source* to "Deploy from a branch", branch `main`, folder `/ (root)`.
4. After a minute or two, the site is live at **https://senapatibalaji.github.io**.

Then update the links on Google Scholar, ORCID, your department profile and your email signature. You can also point the old Google Site to the new address.

## Common edits

- **Add a paper:** in `index.html`, copy one `<li class="pub" ...>` block in the Publications section and edit it. Set `data-type` to `lead` (first author), `collab` or `review`, which controls the filter buttons. To add the gold "featured" bar, add `pub--featured` to the class.
- **Add a talk:** copy one `<li>` inside the relevant `<ul class="events">` list.
- **Update the headline numbers:** edit the `<dl class="stats">` block in the About section.
