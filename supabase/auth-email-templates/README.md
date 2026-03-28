# Supabase Auth Email Templates

These templates are version-controlled so the hosted Supabase project does not drift from the product brand.

They intentionally use `{{ .ConfirmationURL }}` to preserve the current app flow:

- sign up confirmation goes through the existing `/auth/callback` redirect
- magic link sign-in goes through the existing `/auth/callback` redirect
- no auth route changes are required just to replace the generic emails

## Template files

- `confirmation.html`
- `magic-link.html`
- `recovery.html`
- `invite.html`
- `email-change.html`

## Sync options

1. Supabase Dashboard
   Paste the file contents into `Auth -> Templates`.

2. Supabase Management API
   Run the sync script from the repo root:

   ```bash
   pnpm supabase:auth-templates:push
   ```

## Important note

If you later switch to the token-hash SSR pattern from the Supabase Next.js docs, update these templates to use `{{ .TokenHash }}` and point links at a dedicated server route such as `/auth/confirm`.
