# Delve API Server

FastAPI backend deployed on Google Cloud Run.

## Local Development

```bash
# 1. Start Supabase locally
cd /path/to/delve
supabase start

# 2. Copy env and fill in keys
cp .env.example .env
# Edit .env with local Supabase keys (from `supabase status`)

# 3. Install dependencies
poetry install

# 4. Run server
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

Health check: http://localhost:8080/health

## Deploy to Production

```bash
# 1. Copy production env template
cp .env.production.example .env
# Edit .env with production Supabase + Anthropic keys

# 2. Deploy (requires gcloud CLI authenticated)
bash deploy.sh
```

The deploy script:
- Validates required environment variables
- Generates `.env.cloudrun.yaml` (deleted after deploy)
- Deploys to Cloud Run via `gcloud run deploy --source .`
- Verifies health check after deploy

## Testing on Physical Device

The mobile app defaults to `localhost:8080` in dev mode (for simulator).
For physical device testing, either:

1. **Use production backend**: Set `EXPO_PUBLIC_API_URL` env var:
   ```bash
   EXPO_PUBLIC_API_URL=https://delve-api-912297138941.europe-west1.run.app npx expo start
   ```

2. **Use local server over LAN**: Find your machine's IP and set:
   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.x.x:8080 npx expo start
   ```
   Server must be running with `--host 0.0.0.0` (already the default).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/topics` | List all topics with node counts |
| GET | `/api/topics/{id}` | Get topic with all nodes |
| POST | `/api/topics` | Create topic via Claude AI |
| POST | `/api/topics/{id}/nodes/{nodeId}/expand` | Expand a node |
| POST | `/api/topics/{id}/nodes/{nodeId}/suggest-subtopics` | Get subtopic suggestions |
| POST | `/api/topics/{id}/nodes/{nodeId}/subtopics` | Create subtopics |
| GET | `/api/topics/{id}/versions` | List version history |
| GET | `/api/topics/{id}/versions/{versionId}` | Get version snapshot |
| POST | `/api/topics/{id}/versions/{versionId}/restore` | Restore a version |
