# Daniel Zabarsky – 3D Gate CV v4 Action Fixed

This version fixes the GitHub Actions deployment issue where `vite` was not found.

## What changed

- Removed the problematic `package-lock.json`.
- Workflow now deletes any old `node_modules` and old lock file before installing.
- Workflow installs dependencies with `npm install --include=dev`.
- Workflow verifies Vite with `npx vite --version`.
- Workflow builds with `npx vite build`.

## Upload instructions

Upload the extracted contents to the root of the repository.

Important:
Delete the old `package-lock.json` from GitHub before running the workflow again, or replace the repo with this clean version.

GitHub Pages setting:

Settings → Pages → Source: GitHub Actions


## v5 visual/control tweaks

- Removed START / FINISH / YOU labels.
- Changed the sky to blue and widened the ground significantly.
- Swapped left/right movement controls.


## v6 track update

- Added visible curves to the track.
- Made the track longer with more space between gates.


## v7 curve alignment fix

- Rebuilt the track from a single curved centerline path inspired by your uploaded graphic.
- The road, gates, and car all follow the same path now.
- The car moves forward/back along the track and shifts left/right across the road width.


### Build reliability

This version calls Vite directly through `node ./node_modules/vite/bin/vite.js` to avoid the broken `.bin/vite` wrapper issue.
