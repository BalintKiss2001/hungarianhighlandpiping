# CMS and Internal Tools Setup

This repo now includes two free/self-hostable admin options.

## Website CMS

The static website CMS is available at:

```text
HTML/admin/index.html
```

When deployed with the site, open:

```text
/admin/
```

It uses Decap CMS with the GitHub backend and writes changes to:

```text
BalintKiss2001/hungarianhighlandpiping
```

Uploaded media is stored in:

```text
HTML/img/uploads
```

For production login on GitHub, Decap CMS needs a GitHub OAuth/auth proxy configured for the deployed domain. For local UI testing, Decap's local backend is enabled in `HTML/admin/config.yml`.

## Internal Tools

Appsmith can be started locally with Docker:

```powershell
docker compose -f docker-compose.appsmith.yml up -d
```

Then open:

```text
http://localhost:8080
```

Use Appsmith for private admin panels such as booking management, Firestore dashboards, and internal CRUD tools.

## Optional Login and Forum

The site includes a Supabase scaffold for future user-only features:

```text
HTML/login.html
HTML/forum.html
HTML/sql/supabase-forum.sql
HTML/assets/js/supabase-config.js
```

Recommended setup for a static Netlify site:

1. Create a Supabase project.
2. Run `HTML/sql/supabase-forum.sql` in the Supabase SQL editor.
3. Copy your project URL and public anon key into `HTML/assets/js/supabase-config.js`.
4. In Supabase Auth settings, add your deployed Netlify URL to the allowed site/redirect URLs.

The browser only uses the public anon key. Forum write access is protected by Supabase Auth and Postgres Row Level Security.

## Known CMS Path Limitation

The Decap config intentionally skips files with accented characters or spaces in the filename. GitHub/Decap request paths can fail on those names with errors such as `Invalid path specified in request URL`.

For a cleaner CMS later, rename public files to ASCII slugs, for example:

```text
galéria.html -> galeria.html
oldal 2 szolgáltatások.html -> szolgaltatasok.html
```

Then update the links across the site and add those files back to `HTML/admin/config.yml`.
