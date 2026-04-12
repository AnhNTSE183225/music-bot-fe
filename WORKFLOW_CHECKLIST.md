# Workflow Checklist

## Step 1: Services
- Step 1.1: Service scope is front-end only for this repository.
- Step 1.2: `start.ps1` is provided to start this service cleanly with a labeled log prefix.

## Step 2: Layers
- Controller layer: `src/controllers`
- Service layer: `src/services`
- Repository layer: `src/repositories`

## Step 3: Docker
- No external database or mandatory external service for current mock setup.
- `docker-compose.yml` is not required yet.

## Step 4: File boundaries and config
- Files are split by responsibility: UI, controller, service, repository, config, and shared types.
- Master config file is `src/config/app-config.yml`.
- Environment override is supported via `VITE_MUSIC_API_BASE_URL`.
- Fail-fast startup validation is implemented with Zod in `src/config/app-config.ts`.
- Typed config object (`appConfig`) is injected/imported by consumers.

## Step 5: Logging
- Logging level is driven by config (`logging.level` in YAML).
- Logger uses ISO timestamps (`new Date().toISOString()`).
- `INFO` is used for state changes and `DEBUG` for details.

## Step 6: SOLID checks
- Controller handles UI orchestration only.
- Service handles business rules only.
- Repository handles data source only.
- High-level logic depends on repository interface, not concrete data source.

## Step 7-8
- Post-implementation checks completed.
- Errors are normalized at service/controller boundaries in this frontend context.
