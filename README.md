# Dot.ai AI Builder 學員作品展示

**原作者**：daisyyleung（GitHub）

**原 repo**：daisy-workflow-os（原 repo 為 private，故不附連結）。原作者另有自行公開嘅版本。

**本展示副本已將個人／機構資料換成虛構示範資料，功能與原作相同；歷史 commit 未帶入。**

**部署日期**：2026-09-06

---

# Demo Workflow OS

A bilingual, public-facing snapshot of the demo user's workflows, automations, and
user-managed skill registry. It runs on
[vinext](https://github.com/cloudflare/vinext) and is deployed with OpenAI
Sites.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run registry:generate
npm run dev
npm run check
```

The committed registry snapshot contains counts and checksums only. It does not
publish local paths, skill contents, or automation prompts.

## Project Shape

- `app/` contains the dashboard and its generated registry snapshot
- `scripts/generate-registry.mjs` verifies local skills and automations
- `worker/` serves the application and the scroll-video byte-range route
- `tests/` validates registry integrity, standalone output, and byte ranges
- `.openai/hosting.json` binds the repository to its existing Sites project

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run registry:generate`: refresh the privacy-safe registry snapshot
- `npm run registry:check`: fail when the committed snapshot is stale
- `npm run dev`: start local development
- `npm test`: build and verify the standalone dashboard plus source contracts
- `npm run check`: run registry, lint, type, test, and deployment-build checks
- `npm run build`: verify the vinext deployment output
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
