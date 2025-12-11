# Deployment Instructions (Deno Deploy)

This project is a Next.js application configured for Static Export. It serves the `dist` folder using Deno.

## Prerequisites

1.  **Supabase Project**: Ensure your database is set up using the SQL in `supabase_schema.md`.
2.  **Environment Variables**: You will need `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Local Build & Run (Node.js)

```bash
# Install dependencies
npm install

# Build the static site (Output goes to dist/)
npm run build

# Preview locally
npm run start
```

## Deploying to Deno Deploy

You can deploy this project to Deno Deploy easily.

1.  **Build the Project**:
    You must run the build step to generate the `dist` folder before deploying, or configure your CI/CD (like GitHub Actions) to run `npm run build`.

    ```bash
    npm run build
    ```

2.  **Deploy via CLI**:
    If you have the `deployctl` CLI installed:
    ```bash
    deployctl deploy --project=your-project-name --include=dist --include=deploy.ts deploy.ts
    ```

3.  **Deploy via GitHub Integration**:
    1. Push your code to GitHub.
    2. Go to [dash.deno.com](https://dash.deno.com) and create a new project.
    3. Link your repository.
    4. **Build Step**: Deno Deploy's automatic GitHub integration doesn't run `npm run build` by default for Node apps unless configured. You may need to set up a GitHub Action to build the site and deploy the `dist` folder + `deploy.ts`.

    **Example GitHub Action (`.github/workflows/deploy.yml`):**
    ```yaml
    name: Deploy
    on: [push]
    jobs:
      deploy:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
          - uses: actions/setup-node@v3
            with:
              node-version: 18
          - run: npm ci
          - run: npm run build
            env:
              NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
              NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          - uses: denoland/deployctl@v1
            with:
              project: "your-project-name"
              entrypoint: "deploy.ts"
              root: "."
    ```
