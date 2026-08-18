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

The admin page is only shown to logged-in Supabase users whose email is listed in:

```text
HTML/assets/js/supabase-config.js -> window.HHP_ADMIN_EMAILS
```

By default the admin account is:

```text
kissbalint12@gmail.com
```

Admin-only draft pages are also available from the logged-in admin navigation:

```text
HTML/fellepesek.html
HTML/rendezveny-csomagok.html
HTML/tanulas.html
```

These pages use `HTML/assets/js/admin-page-guard.js`, so direct access redirects non-admin users.

It uses Decap CMS with the GitHub backend and writes changes to:

```text
BalintKiss2001/hungarianhighlandpiping
```

Uploaded media is stored in:

```text
HTML/img/uploads
```

For production login on Netlify, use Netlify's built-in GitHub OAuth provider. Create a GitHub OAuth App with this callback URL:

```text
https://api.netlify.com/auth/done
```

Then add the GitHub Client ID and Client Secret in Netlify:

```text
Project configuration -> Access & security -> OAuth -> Authentication Providers -> GitHub
```

With Netlify's OAuth provider, the current Decap `github` backend can stay simple; no separate OAuth proxy domain is needed. For local UI testing, Decap's local backend is enabled in `HTML/admin/config.yml`.

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

## Resend Notification Emails

Booking confirmation emails now use Resend from Firebase Functions.

Required setup:

```powershell
cd HTML
firebase functions:secrets:set RESEND_API_KEY
```

Create `HTML/functions/.env` from `HTML/functions/.env.example` and set the sender/recipient:

```text
RESEND_FROM="Kiss Balint Skotdudas <ertesites@sajatdomain.hu>"
NOTIFICATION_TO="thehungarianhighlandpiper@gmail.com"
```

Use an email address on your verified Resend domain for `RESEND_FROM`, for example `ertesites@sajatdomain.hu`.

## Known CMS Path Limitation

The Decap config intentionally skips files with accented characters or spaces in the filename. GitHub/Decap request paths can fail on those names with errors such as `Invalid path specified in request URL`.

For a cleaner CMS later, rename public files to ASCII slugs, for example:

```text
galéria.html -> galeria.html
oldal 2 szolgáltatások.html -> szolgaltatasok.html
```

Then update the links across the site and add those files back to `HTML/admin/config.yml`.
