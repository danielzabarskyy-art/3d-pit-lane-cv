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


## v8 actual track asset test

- Extracted and included the uploaded `track.zip` asset pack.
- Loads `RaceTrackExport/Track.fbx` and `RaceTrackExport/Banners.fbx`.
- Keeps a shared curved gameplay path for gates and car movement while rendering the actual track model.


## v8.1 deployment patch

This version fixes the previous GitHub Actions issue where `vite` was missing from `node_modules`.

The workflow now:
- removes stale `node_modules` and `package-lock.json`
- installs all runtime/build dependencies explicitly
- verifies Vite with `npx vite --version`
- builds with `npx vite build`

Important: make sure `.github/workflows/deploy.yml` is uploaded/replaced in GitHub.


## v8.2 small track file

This version replaces the 53 MB `Track.fbx` with a reduced `Track_small.glb` file of about 21 MB, so every individual file is below GitHub browser upload limits.

What changed:
- Removed original `Track.fbx`.
- Added `public/trackpack/RaceTrackExport/Track_small.glb`.
- Updated the code to load the small GLB with `GLTFLoader`.
- Kept `Banners.fbx` and banner images.


## v8.3 robust build patch

This version fixes the `vite: not found` error even if GitHub accidentally keeps an older workflow.

Changes:
- `package.json` build script now installs dependencies before building.
- `.github/workflows/deploy.yml` is still included and should be uploaded/replaced.
- A copy of the workflow is also included as `COPY_THIS_TO_GITHUB_DEPLOY_YML.txt` in case the hidden `.github` folder is missed by the browser uploader.
