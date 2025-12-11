# Deployment Instructions

This project is a Next.js application configured for Static Export. It uses Supabase for the backend.

## Prerequisites

1.  **Supabase Project**: You need a Supabase project. Run the SQL found in `supabase_schema.md` in your Supabase SQL Editor.
2.  **Environment Variables**: Create a `.env.local` file in the root directory (do not commit this file) with your keys:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
    ```

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Deployment to Wasmer

1.  **Build the project**:
    This runs `next build` and moves the static output to the `dist` folder.
    ```bash
    npm run build
    ```

2.  **Deploy**:
    Ensure the `wasmer.toml` file exists (see below), then run:
    ```bash
    wasmer deploy
    ```

## Configuration (`wasmer.toml`)

The project requires the following `wasmer.toml` configuration in the root directory to serve the static files correctly:

```toml
[package]
name = "discord-clone"
version = "0.1.0"
description = "Discord Clone built with Next.js"
publish = false

[dependencies]
"wasmer/static-web-server" = "^1"

[fs]
public = "dist"

[[command]]
name = "start"
module = "wasmer/static-web-server:webserver"
runner = "https://webc.org/runner/wasi"

[command.annotations.wasi]
env = ["SERVER_PORT=8080"]
main_args = ["--port", "8080", "--root", "public", "--page-fallback", "index.html"]
```
