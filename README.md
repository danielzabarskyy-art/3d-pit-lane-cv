# Daniel Zabarsky – 3D Pit Lane CV

Complete React + Vite + React Three Fiber project with the uploaded FAB car FBX assets included.

## Included car assets

The following files are included under `public/models/`:

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

## Build

```bash
npm run build
```

## GitHub Pages deployment

This project uses GitHub Actions.

In GitHub:

1. Upload all project files and folders to your repository.
2. Go to `Settings → Pages`.
3. Under `Build and deployment`, choose:
   - Source: `GitHub Actions`
4. Commit to `main`.
5. Go to the `Actions` tab.
6. Wait until the workflow is green.
7. Open your GitHub Pages link.

## Controls

- `WASD` or arrow keys: drive the police car.
- Enter a pit stop to reveal the relevant CV section.
- Click pit labels or the side buttons to switch sections.

## Notes

The site uses FBXLoader from Three.js, so the `.fbx` files and `.png` textures must stay in `public/models/`.
