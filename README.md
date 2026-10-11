# Café BLK & BRWN – Static Website (CC 312)

Open `index.html` in a browser. No installs needed (the branch map needs internet for its tiles).

```
index, about, menu, branches, reserve, track, gallery, contact, privacy .html   public pages
staff.html                                                                      staff demo (not in the menu)
css/   style.css imports: base (fonts, colours, background), layout, header, buttons, cards, forms,
       gallery, menu, map, staff, footer, motion (reveals, preloader, marquee, cup), home (scroll scenes), responsive
js/    icons.js   inline icon sprite (works when double-clicked)
       main.js    phone menu, footer year, sliding tab highlight
       motion.js  animation engine: reveals, split text, counters, tilt, magnetic buttons, page curtain, preloader
       scenes.js  scroll-linked scenes (pinned hero, drinks showcase, horizontal branch ride) and marquees
       menu.js, branches.js, reserve.js, contact.js, gallery.js, staff.js   page scripts
assets/
  fonts/           DM Sans + Playfair Display (self-hosted)
  logo.jpg, hero_image.jpg
  Branches/ Kape Series/ Chai Blend/ Choco Series/ Over - Ice Series/ Freskaro Juices/ Hot Beverages/ Food & Snacks/ Gallery/
```

## Motion
- Every animated element is switched on by an attribute: `data-reveal="rise|flip|pop|spin|slide-l|slide-r|zoom|clip|wipe|line"`, `data-split` (headings rise word by word), `data-stagger`, `data-tilt`, `data-parallax`, `data-count`.
- Scroll scenes use `data-scene="pin|view"`: `js/scenes.js` writes a smoothed `--p` (0 to 1) and `css/home.css` does the maths.
- Respects "reduce motion" and works without JavaScript (pinned scenes become normal sections).

## Editing
- Menu item: copy one `<li>` in `menu.html` (photo in its category folder, price, optional note and badge).
- Branch hours, Facebook links and event-night notes live in the cards in `branches.html`; the map pins are in `js/branches.js`.
- Staff demo login: staff@cafeblkbrwn.com / brwn2026
- Content rules (name, PHP format, captions, messages): see `CONTENT-ericka.md`.
