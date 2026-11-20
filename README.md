# Saumya Garg Portfolio

Static site, deployed by Vercel from `main`.

- `index.html`: home page: sun loader, then the animated ship hero
- `css/hero.css`, `js/hero.js`: hero layout and animation. The ship scene is Saumya's painted layers (sea, clouds, ship, flag, pirate, spyglass) in `assets/hero/`, placed on the 1920 x 1080 artboard with percentages. The sea is a seamless tile that scrolls; the ship sails in from the right after the loader, then bobs; the flag flutters; the spyglass slides out and glints. All motion stops under prefers-reduced-motion and pauses when the hero is off screen.
- `css/loader.css`, `js/loader.js`: the sun loader (47 watercolour frames in `assets/sun-sprite.webp`, tied to real loading progress, capped at the original 17 fps)
