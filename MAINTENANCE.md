# Maintenance

## Local checks

Run the same commands as CI before pushing. Node.js 22 or later is required.

```bash
npm ci
npm run lint
npm test
npm run build
```

`npm run lint` runs `tsc --noEmit`, `npm test` runs vitest once, and `npm run build` writes the extension to `.output/chrome-mv3`.

## Monthly upkeep

- [ ] Review and merge the Dependabot pull requests. Minor and patch npm updates arrive as one grouped PR. Check that CI is green before merging.
- [ ] Run `npm audit` and fix or note anything high or critical.
- [ ] Read the WXT release notes for breaking changes.
- [ ] Check the Chrome Manifest V3 and Chrome Web Store announcements for policy or API changes.
- [ ] Load the build from `.output/chrome-mv3` in Chrome and open a Markdown file to confirm it still renders.

## Releasing

1. Bump the version, which updates `package.json`, commits and tags. Use `patch`, `minor` or `major`.

   ```bash
   npm version patch
   ```

2. Push the commit and the tag.

   ```bash
   git push --follow-tags
   ```

3. The tag runs the Release workflow. It checks the tag against `package.json`, runs the tests, builds the zip and attaches it to a GitHub release.
4. Download the `-chrome.zip` from the GitHub release.
5. Open the Chrome Web Store developer dashboard, choose the extension, go to Package, and upload the zip.
6. Submit the new version for review.

## Store listing

The store assets are in `docs/`:

- `store-1.jpg` to `store-5.jpg`: store screenshots
- `mp-small-promo-tile.png`: small promo tile
- `mp-marquee-promo-tile.png`: marquee promo tile
- `screenshot-1.png` to `screenshot-3.png`, `screenshot-theme-dark.png`, `screenshot-theme-light.png`: README and listing screenshots

Upload changes to the listing in the Chrome Web Store dashboard under Store listing.
