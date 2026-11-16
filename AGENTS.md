<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Startex project rules

- Lesson video data (YouTube URL, uploaded file path, materials) lives in `lesson_media`, not `lessons`, so RLS can show locked thumbnails to everyone signed in while gating video to `has_active_access()` or free previews.
- Access checks go through the SQL functions `has_role()` and `has_active_access()`; client helpers in `src/lib/lessons.ts` only mirror them for UI.
- Members area routes live under `src/routes/_authenticated/` (client-only gate redirecting to `/entrar`); the layout renders `AppShell` with the hamburger menu.
- Payments are not wired yet: `SubscribeButton` is the single entry point to replace when the payment provider is added.
- Brand logo is served from `.asset.json` pointers in `src/assets/`; the light variant exists because the original navy lettering is unreadable on the dark theme.
