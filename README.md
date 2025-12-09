# koishi-plugin-aris-chat

Aris Chat — Koishi plugin: 智能戳一戳 / 互动聊天功能 (Alice-like)

This plugin adds a cute interactive "poke" feature with a five-level mood system, counter-pokes, and optional API-driven dynamic replies. It persists user and group states via Koishi database (Minato API).

## Features
- Five-level group mood (neutral, pleasant, annoyed, angry, furious)
- Per-user state for poke counts, counters, rates and cooldowns
- Configurable thresholds and response styles (gentle, fast, flirty)
- Optional external API-driven replies (GET/POST)
- Cross-platform adapters with graceful fallback (OneBot native poke, or plain text)
- Persistence via Koishi DB (sqlite/mysql) using `ctx.database` and `upsert`

## Install

```bash
# from npm
npm i koishi-plugin-aris-chat

# or from your local path while developing
npm i /absolute/path/to/koishi-plugin-aris-chat
```

## Configuration

Add to your `koishi.config.ts` (or app config):

```ts
export default {
  database: { type: 'sqlite', filename: 'data.sqlite' },
  plugins: [
    ['koishi-plugin-aris-chat', {
      persistenceEnable: true,
      // See Config in the plugin for all options
    }]
  ]
}
```

Key options:
- `persistenceEnable`: boolean — enable DB persistence (requires Koishi database configured)
- `enableGroupCounting`: boolean — whether to use group-based mood counting
- `enableApiResponse`: boolean — use external API for dynamic replies
- `apiUrl`/`apiMethod`/`apiTimeout` — configured for calling the external API

## Commands
- `poke.reset` — reset user and group poke states (admin only when configured)
- `poke.status` — show current user/group poke status
- `poke.affection` — view your current affection score (in-memory)

## Development

```bash
# Install dev deps and build
npm install
npm run build

# Link for local testing
npm link
cd /path/to/your/koishi-bot
npm link koishi-plugin-aris-chat

# Start your bot and test the plugin
```

## Publishing

To publish to npm manually:

```bash
npm login
npm version patch # or minor/major
git push && git push --tags
npm publish --access public
```

If you want to enable automatic publishes on tag push, set `NPM_TOKEN` in the repository secrets and the included `publish.yml` will run when you push tags like `v1.0.0`.

## Contributing

PRs welcome. Please ensure `npm run build` and `npm run lint` pass on CI.

## License

MIT — see LICENSE
