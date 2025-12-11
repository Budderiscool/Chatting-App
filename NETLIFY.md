# Deployment Instructions (Netlify)

This project is a Next.js application configured for Static Export.

## Prerequisites

1.  **Supabase Project**: Ensure your database is set up using the SQL in `supabase_schema.md`.
2.  **Environment Variables**: You will need `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Configuration File (`netlify.toml`)

Create a file named `netlify.toml` in the root of your project with the following content:

```toml
[build]
  command = "npm run build"
  publish = "out"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Deploying to Netlify

### Option 1: Drag & Drop (Manual)

1.  Run the build command locally:
    ```bash
    npm install
    npm run build
    ```
2.  This creates an `out` folder.
3.  Go to [app.netlify.com/drop](https://app.netlify.com/drop).
4.  Drag the `out` folder onto the page.
5.  Once uploaded, go to **Site Settings > Environment Variables** and add your Supabase keys:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Option 2: Git Integration (Recommended)

1.  Push your code to GitHub, GitLab, or Bitbucket.
2.  Log in to Netlify and click **"Add new site"** > **"Import an existing project"**.
3.  Select your repository.
4.  Netlify should detect the settings automatically from `netlify.toml`:
    *   **Build command**: `npm run build`
    *   **Publish directory**: `out`
5.  Click **"Show advanced"** (or go to Site Settings later) and add your Environment Variables:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6.  Click **Deploy**.
