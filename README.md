# Saumya Garg Portfolio

Static site, deployed by Vercel from `main`.

- `index.html`: home page: sun loader, then the animated ship hero
- `css/hero.css`, `js/hero.js`, `js/sea.js`: hero layout and animation. The scene is Saumya's painted layers in `assets/hero/` (sea, clouds, ship, flag, pirate, and the spyglass as body, rim and lens), mirrored to match the design and placed on the 1920 x 1080 artboard with percentages. `sea.js` draws the sea with WebGL: overlapping swells that grow toward the viewer, light on the crests, shimmering foam and a slow colour wash, with a second pass in front of the hull so the ship sits in the water; the ship heaves and pitches on the same swell. The ship sails in after the loader, the flag flutters, the spyglass extends and glints. Without WebGL the still sea shows; prefers-reduced-motion gets one still frame; everything pauses off screen.
