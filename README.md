# Daniel Zabarsky – 3D Gate CV v4

Updated version with:

1. Start screen title changed to `Daniel Zabarsky CV`.
2. Added the personal opening paragraph before car selection.
3. Flipped the FBX car orientation so it should drive forward instead of backwards.
4. Extended the track length.
5. Replaced floating HTML gate labels with fixed 3D gate signs.

## Gate order

- Gate 01: Stratasys
- Gate 02: BGRaicing
- Gate 03: Education
- Gate 04: Skills
- Gate 05: Military

## Local setup

```bash
npm install
npm run dev
```

## GitHub Pages

Use:

`Settings → Pages → Source: GitHub Actions`

Then wait for the Action to turn green.


## v4.1 deployment fix

The GitHub Actions workflow now uses Node 24 and sets:

`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`

If GitHub still prints a Node 20 deprecation warning for official actions, check whether the workflow still completes with a green check. That warning alone is not the same as a failed deployment.
