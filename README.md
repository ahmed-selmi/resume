# Personal CV + AI Resume Tailoring

This repository now contains two tracks:

- LaTeX CV sources and PDF build flow.
- AI resume tailoring web app (GitHub Pages frontend + Vercel API using OpenRouter).

## Existing LaTeX CV

- Source: `src/cv.tex`
- Build workflow: `.github/workflows/build.yml`

## AI Resume Tool

- Frontend app: `web/`
- Vercel API route: `api/tailor.js`
- Pages deployment workflow: `.github/workflows/pages.yml`

### Local development

1. Install frontend dependencies:

   ```bash
   cd web
   npm install
   ```

2. Configure API URL for the frontend:

   ```bash
   cp .env.example .env.local
   ```

3. Run the frontend:

   ```bash
   npm run dev
   ```

4. Deploy API to Vercel and set these environment variables there:

- `OPENROUTER_API_KEY` (required)
- `OPENROUTER_MODEL` (optional, defaults to `openai/gpt-4o-mini`)

### Frontend environment variables

In `web/.env.local` (for local) and GitHub repo variables (for Pages build):

- `VITE_API_BASE_URL` (required)  
  Example: `https://your-vercel-project.vercel.app`

The app calls `${VITE_API_BASE_URL}/api/tailor`.

### GitHub Pages deployment

The Pages workflow in `.github/workflows/pages.yml` builds `web/` and deploys `web/dist`.

Set repository variable:

- `VITE_API_BASE_URL` => your deployed Vercel base URL.
