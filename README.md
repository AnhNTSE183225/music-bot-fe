# Music Bot Frontend

Frontend control panel for a music bot, built with Vite + React + TypeScript and using shadcn as the primary UI library.

## Stack
- Vite + React + TypeScript
- shadcn/ui components
- Tailwind CSS v4
- Zod + YAML for centralized app config validation

## Run
```powershell
npm install
npm run dev
```

Or use:

```powershell
./start.ps1
```

## Build
```powershell
npm run build
```

## Architecture
- Controller: `src/controllers/use-music-controller.ts`
- Service: `src/services/music-service.ts`
- Repository: `src/repositories/music-repository.ts`
- Config: `src/config/app-config.yml` + `src/config/app-config.ts`

## Features
- Live playback status, queue, vote skip, and volume from MusicBot HTTP API
- Center YouTube panel for search + preview
- Click-to-confirm add-to-queue modal for YouTube links
- Top-right admin login button for protected controls

## Configuration
- Master config file: `src/config/app-config.yml`
- Environment override: `VITE_MUSIC_API_BASE_URL`
- Fail-fast validation is executed at startup with Zod.

## Notes
- Default API URL points to `http://localhost:8080/api`.
- The direct YouTube embed preview was removed because it was not contributing useful behavior.
- Admin access uses credentials from the bot process `.env` file via the web API login dialog.

## CI/CD: GitHub Pages
- Workflow file: `.github/workflows/music-bot-fe-pages.yml`
- Deployment target: GitHub Pages using GitHub Actions
- Trigger on pushes to `main` affecting `music-bot-fe/**`
- Trigger by manual run (`workflow_dispatch`)

### Repository secrets
- `MUSIC_API_BASE_URL`: backend API base URL for production builds.

During CI build, `MUSIC_API_BASE_URL` is injected into `VITE_MUSIC_API_BASE_URL`, which overrides `src/config/app-config.yml`.

### Important behavior
GitHub does not emit workflow events when a secret value changes. Because of that, changing `MUSIC_API_BASE_URL` alone will not immediately redeploy.

To apply a new secret value, use one of these:
- Run the workflow manually from the Actions tab.
- Push a commit that touches `music-bot-fe/**`.
