# Daniel Zabarsky – 3D Gate CV v3

Clean gate-based version.

## Main fixes

1. Selection screen is now clean and static:
   - The 3D scene does not render behind the selection screen.
   - No labels or car animations bleed through.

2. Only one car exists in the game:
   - The selected player car.
   - No automatic traffic cars.

3. Pits were replaced by gates:
   - Pass a gate to unlock and show the matching CV section on the right side.

## Chronological gate order

- Gate 01: Stratasys
- Gate 02: BGRaicing
- Gate 03: Education
- Gate 04: Skills
- Gate 05: Military

## Included model files

- `Car.fbx`
- `Car_stylized.fbx`
- `Police.fbx`
- `Police_stylized.fbx`
- `Taxi.fbx`
- `Taxi_stylized.fbx`
- `Car_color.png`
- `Car_details.png`
- `Car_Number.png`
- `Car_Police.png`
- `Car_Taxi.png`
- `Glass.png`

## Local setup

```bash
npm install
npm run dev
```

## GitHub Pages

Use:

`Settings → Pages → Source: GitHub Actions`

Then wait for the Action to turn green.
